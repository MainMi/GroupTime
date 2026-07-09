import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EventTable from '../../components/Schedule/EventTable/EventTable';
import ModalCreateEvent from '../../components/Schedule/ModalCreateEvent/ModalCreateEvent';
import Button from '../../UI/Button/Button';
import ButtonSmall from '../../UI/Button/ButtonSmall';
import Calendar from '../../UI/Calendar/Calendar';
import Dropdown from '../../UI/Dropdown/Dropdown';
import Loader from '../../UI/Loader/Loader';
import ScheduleFilter from '../../components/Schedule/ScheduleFilter/ScheduleFilter';
import ModalScheduleSettings from '../../components/Schedule/ModalScheduleSettings/ModalScheduleSettings';
import ConfirmModal from '../../UI/ConfirmModal/ConfirmModal';
import roleEnum from '../../constants/roleEnum';
import { canEditEvents, canViewSchedule } from '../../helper/roleHelper';
import { SCHEDULE_TYPE } from '../../constants/scheduleEnum';
import groupTypeEnum from '../../constants/type/groupTypeEnum';
import { colorForType } from '../../constants/type/eventEnum';
import { EMPTY_FILTER } from '../../helper/scheduleFilter';
import classes from './Schedule.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchUserInfo } from '../../redux/actions/auth-actions';
import { getISOWeekNumber, atNoon } from '../../helper/dateHelper';
import { getStorage, setStorage } from '../../helper/storageHelper';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { DEFAULT_CACHE_TTL } from '../../constants/cacheConfig';
import { getScheduleWeekInfo, getScheduleVersion } from '../../api/scheduleFetch';
import { schedulehAction } from '../../redux/slices/schedule-slice';
import calendarEnum from '../../constants/calendarEnum';
import logo from '../../static/image/globalcons/logo.svg';
import Modalassistant from '../../components/Schedule/ModalAssitent/ModalAssitent';
import ScheduleTour from '../../components/Onboarding/ScheduleTour';

import { deleteStaticEvent, deleteDynamicEvent, editEvent, importEvents } from '../../api/eventFetch';
import { showSuccessNotification, showErrorNotification } from '../../redux/actions/notification-actions';

// Merge several groups' week data into one, tagging each event with its group
// so per-event edit/delete still knows the target group in "all groups" mode.
const mergeScheduleData = (parts) => {
    const staticWeek = [];
    const dynamicWeek = [];
    parts.forEach(({ data, groupId, groupName, groupAvatar }) => {
        (data?.staticWeek || []).forEach((day) => {
            staticWeek.push({ ...day, events: (day.events || []).map((ev) => ({ ...ev, groupId, groupName, groupAvatar })) });
        });
        (data?.dynamicWeek || []).forEach((day) => {
            dynamicWeek.push({ ...day, events: (day.events || []).map((ev) => ({ ...ev, groupId, groupName, groupAvatar })) });
        });
    });
    return { staticWeek, dynamicWeek };
};

const SchedulePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const userInfo = useSelector((state) => state.auth.userInfo);
    const schedules = useSelector((state) => state.schedule.schedules);

    const [date, setDate] = useState(() => atNoon(new Date()));
    const [isModalEvent, setIsModalEvent] = useState(false);
    const [isModalSettings, setIsModalSettings] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);
    const [isModalassistant, setIsModalassistant] = useState(false);
    const [timeSheet, setTimeSheet] = useState(1);
    const [existingItem, setExistingItem] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [selectedGroup, setSelectedGroup] = useState(() => {
        const stored = getStorage(STORAGE_KEYS.SELECTED_GROUP);
        if (stored === 'all') return 'all';
        const idx = userInfo?.groups?.findIndex((g) => g.group?._id === stored);
        return idx != null && idx >= 0 ? idx : 0;
    });
    const [editEventData, setEditEventData] = useState(null);
    const [activeFilter, setActiveFilter] = useState(EMPTY_FILTER);
    // >0 shows the "assistant changed N events — refresh the view?" prompt.
    const [assistantRefreshCount, setAssistantRefreshCount] = useState(0);

    // Refs to avoid stale closures without adding to effect deps
    const schedulesRef = useRef(schedules);
    schedulesRef.current = schedules;
    const userInfoRef = useRef(userInfo);
    userInfoRef.current = userInfo;
    const activeFilterRef = useRef(activeFilter);
    activeFilterRef.current = activeFilter;
    const dateRef = useRef(date);
    dateRef.current = date;
    const selectedGroupRef = useRef(selectedGroup);
    selectedGroupRef.current = selectedGroup;
    // Tallies assistant-applied changes during one assistant session: total (for cache
    // invalidation) and how many affect the schedule currently on screen.
    const assistantChangesRef = useRef({ total: 0, relevant: 0 });

    // Restore the persisted group once the user's groups are available, and keep the
    // selection valid: if the stored group was deleted, fall back to the first one.
    const didInitGroupRef = useRef(false);
    useEffect(() => {
        const groups = userInfo?.groups;
        if (!groups?.length) return;
        const stored = getStorage(STORAGE_KEYS.SELECTED_GROUP);
        if (stored === 'all') {
            setSelectedGroup('all');
        } else if (stored) {
            const idx = groups.findIndex((g) => g.group?._id === stored);
            setSelectedGroup(idx >= 0 ? idx : 0);
        }
        didInitGroupRef.current = true;
    }, [userInfo]);

    // Persist the selection by group id (only after the initial restore, so the
    // dropdown's mount-time auto-fire can't clobber the stored value).
    useEffect(() => {
        if (!didInitGroupRef.current) return;
        if (selectedGroup === 'all') {
            setStorage(STORAGE_KEYS.SELECTED_GROUP, 'all');
        } else {
            const g = userInfoRef.current?.groups?.[selectedGroup]?.group;
            if (g?._id) setStorage(STORAGE_KEYS.SELECTED_GROUP, g._id);
        }
    }, [selectedGroup]);

    const squareIcons = ['square', 'duo-square', 'three-square'];

    const handlePrevWeek = useCallback(() => {
        setDate(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() - 7);
            return atNoon(d);
        });
    }, []);

    const handleNextWeek = useCallback(() => {
        setDate(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() + 7);
            return atNoon(d);
        });
    }, []);

    // Calendar: use noon to prevent UTC midnight timezone rollover (date -1 bug)
    const handleCalendarDateChange = useCallback((newDate) => {
        const noonDate = atNoon(new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate()));
        setDate(prev => {
            if (
                getISOWeekNumber(prev) === getISOWeekNumber(noonDate) &&
                prev.getFullYear() === noonDate.getFullYear()
            ) {
                return prev;
            }
            return noonDate;
        });
    }, []);

    const monthLocale = i18n.language?.startsWith('en') ? 'en-US' : 'uk-UA';
    const monthName = date.toLocaleString(monthLocale, { month: 'long' });
    const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const timeSheetChangeHandler = () => setTimeSheet(
        timeSheet !== calendarEnum.MTD ? timeSheet + 1 : 0
    );

    // Is `groupId` part of what the schedule is currently showing (single group, or
    // one of the filtered groups in "all" mode)?
    const isGroupViewed = useCallback((groupId) => {
        const ui = userInfoRef.current;
        const sg = selectedGroupRef.current;
        if (!ui?.groups || groupId == null) return false;
        if (sg === 'all') {
            const ids = activeFilterRef.current?.groups || [];
            return ui.groups.some((g) => g.group && canViewSchedule(g.role)
                && (!ids.length || ids.includes(g.group._id))
                && String(g.group._id) === String(groupId));
        }
        const entry = ui.groups[sg];
        return !!(entry?.group && canViewSchedule(entry.role)
            && String(entry.group._id) === String(groupId));
    }, []);

    // An applied change is "relevant" only if it touches the on-screen schedule:
    // the group must be viewed, and (for one-off events) the date must fall in the
    // displayed week. Recurring (static) changes affect every week, so they always do.
    const isChangeRelevant = useCallback((action) => {
        if (!action?.groupId || !isGroupViewed(action.groupId)) return false;
        const isStatic = action.scheduleType
            ? action.scheduleType === SCHEDULE_TYPE.STATIC
            : !!action.event?.day;
        if (isStatic) return true;
        const d = action.event?.date ? new Date(action.event.date) : null;
        if (!d || Number.isNaN(d.getTime())) return true;
        return getISOWeekNumber(d) === getISOWeekNumber(dateRef.current);
    }, [isGroupViewed]);

    // Called once per assistant-applied event change: always invalidate that group's
    // cached weeks, and tally whether the on-screen view needs refreshing.
    const handleAssistantMutation = useCallback((action) => {
        if (action?.groupId) dispatch(schedulehAction.clearGroupSchedules(action.groupId));
        assistantChangesRef.current.total += 1;
        if (isChangeRelevant(action)) assistantChangesRef.current.relevant += 1;
    }, [dispatch, isChangeRelevant]);

    const openAssistant = useCallback(() => {
        assistantChangesRef.current = { total: 0, relevant: 0 };
        setIsModalassistant(true);
    }, []);

    // On close: a single relevant change refreshes silently; several ask first so we
    // don't reload (and lose scroll position) without the user expecting it.
    const closeAssistant = useCallback(() => {
        setIsModalassistant(false);
        const { relevant } = assistantChangesRef.current;
        if (relevant >= 2) {
            setAssistantRefreshCount(relevant);
        } else if (relevant === 1) {
            refreshScheduleRef.current(true);
        }
        assistantChangesRef.current = { total: 0, relevant: 0 };
    }, []);

    const refreshSchedule = useCallback(async (force = false) => {
        const ui = userInfoRef.current;
        if (!ui?.groups?.length) return;
        const isoWeek = getISOWeekNumber(date);

        // Resolve which groups to load: one specific group, or several in "all"
        // mode. Skip groups whose role can't view the schedule so we never fire a
        // request that the backend would reject (and never break "all groups").
        let targetGroups;
        if (selectedGroup === 'all') {
            const ids = activeFilterRef.current?.groups || [];
            targetGroups = ui.groups
                .filter((g) => g.group && canViewSchedule(g.role) && (!ids.length || ids.includes(g.group._id)))
                .map((g) => g.group);
        } else {
            const entry = ui.groups[selectedGroup];
            targetGroups = (entry?.group && canViewSchedule(entry.role)) ? [entry.group] : [];
        }

        if (!targetGroups.length) {
            setExistingItem({ data: { staticWeek: [], dynamicWeek: [] }, ok: true });
            return;
        }

        // A forced refresh always follows a mutation. Since static changes affect
        // many weeks at once, drop every cached week for the target groups (not just
        // the current one) so other weeks don't show stale data.
        if (force) {
            targetGroups.forEach((g) => dispatch(schedulehAction.clearGroupSchedules(g._id)));
        }

        setIsLoading(true);
        try {
            // Reuse cached weeks where possible. Within CACHE_TTL we trust the
            // cache outright; beyond it we do a cheap /week/version check and only
            // re-download the full week when the version actually changed.
            const parts = await Promise.all(targetGroups.map(async (g) => {
                const groupId = g._id;
                const gidStr = String(groupId);
                if (!force) {
                    const cached = schedulesRef.current.find(
                        s => s.isoWeek === isoWeek && s.groupId === gidStr
                    );
                    if (cached) {
                        const fresh = (Date.now() - (cached.fetchedAt || 0)) < DEFAULT_CACHE_TTL;
                        if (fresh) {
                            return { data: cached.data, groupId: gidStr, groupName: g.name, groupAvatar: g.avatar?.location };
                        }
                        // Stale by time — verify against the server version.
                        if (cached.version != null) {
                            const vres = await getScheduleVersion({ date, groupId }, navigate);
                            const remoteVersion = vres?.data?.version;
                            if (remoteVersion != null && remoteVersion === cached.version) {
                                dispatch(schedulehAction.touchSchedule({ isoWeek, groupId: gidStr }));
                                return { data: cached.data, groupId: gidStr, groupName: g.name, groupAvatar: g.avatar?.location };
                            }
                        }
                    }
                }
                const res = await dispatch(getScheduleWeekInfo({ date, groupId }, navigate));
                return { data: res?.data || {}, groupId: gidStr, groupName: g.name, groupAvatar: g.avatar?.location };
            }));

            if (selectedGroup === 'all') {
                setExistingItem({ data: mergeScheduleData(parts), ok: true });
            } else {
                setExistingItem({ data: parts[0].data, ok: true });
            }
        } finally {
            setIsLoading(false);
        }
    }, [dispatch, navigate, date, selectedGroup]);

    const refreshScheduleRef = useRef(refreshSchedule);
    useEffect(() => { refreshScheduleRef.current = refreshSchedule; });

    // In "all" mode, re-fetch when the chosen groups change
    const groupFilterKey = selectedGroup === 'all' ? (activeFilter.groups || []).join(',') : '';

    useEffect(() => {
        if (!userInfo?.nickname) {
            dispatch(fetchUserInfo(navigate));
            return;
        }
        refreshScheduleRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userInfo?.nickname, date, selectedGroup, groupFilterKey, dispatch, navigate]);

    const handleOpenCreateModal = useCallback(() => {
        setEditEventData(null);
        setIsModalEvent(true);
    }, []);

    // Import events from a chosen .ics file (Google/Outlook/Apple export). Reads
    // the file as text and posts it; each calendar entry becomes a one-off event.
    const importInputRef = useRef(null);
    const [isImporting, setIsImporting] = useState(false);
    const handleImportFile = useCallback(async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const groupId = userInfoRef.current?.groups?.[selectedGroupRef.current]?.group?._id;
        if (!groupId) {
            dispatch(showErrorNotification(t('schedule.selectGroupToEdit')));
            return;
        }
        setIsImporting(true);
        try {
            const ics = await file.text();
            const res = await importEvents({ groupId, ics }, navigate);
            if (res && res.ok !== false) {
                dispatch(showSuccessNotification(t('schedule.imported', { count: res.data?.imported ?? 0 })));
                refreshScheduleRef.current(true);
            } else {
                dispatch(showErrorNotification(t('schedule.importError')));
            }
        } catch (error) {
            dispatch(showErrorNotification(t('schedule.importError')));
        } finally {
            setIsImporting(false);
        }
    }, [dispatch, navigate, t]);

    // Open a confirmation modal before deleting an event
    const requestDeleteEvent = useCallback((ev) => {
        setEventToDelete(ev);
    }, []);

    const handleDeleteEvent = useCallback(async (ev) => {
        try {
            const groupId = ev.groupId || userInfoRef.current.groups[selectedGroup]?.group?._id;
            if (!groupId) {
                dispatch(showErrorNotification(t('schedule.selectGroupToEdit')));
                return;
            }
            const deleteApi = ev.isStatic ? deleteStaticEvent : deleteDynamicEvent;
            await deleteApi({
                groupId,
                eventInfoId: ev.eventInfo._id,
                date: { day: ev.eventDate.day, countWeek: ev.eventDate.countWeek }
            }, navigate);
            dispatch(showSuccessNotification(t('schedule.eventDeleted')));
            // Force refresh after mutation
            refreshScheduleRef.current(true);
        } catch (error) {
            dispatch(showErrorNotification(t('schedule.deleteError')));
        }
    }, [dispatch, navigate, selectedGroup]);

    // Reschedule an event by drag-and-drop: send only the identifiers and the new
    // date. The eventInfo fields are not re-sent, so a move can't overwrite a
    // teammate's concurrent edit or trip validation on legacy field values.
    // Static events stay in their static week.
    const handleMoveEvent = useCallback(async (ev, targetDate) => {
        try {
            const groupId = ev.groupId || userInfoRef.current.groups[selectedGroup]?.group?._id;
            if (!groupId) {
                dispatch(showErrorNotification(t('schedule.selectGroupToEdit')));
                return;
            }
            const res = await editEvent({
                groupId,
                isStatic: !!ev.isStatic,
                eventInfoId: ev.eventInfo._id,
                eventDateId: ev.eventDate._id,
                duration: ev.eventDate.duration,
                date: targetDate.toString(),
            }, navigate);
            if (res && res.ok !== false) {
                dispatch(showSuccessNotification(t('event.updated')));
                refreshScheduleRef.current(true);
            } else {
                dispatch(showErrorNotification(t('schedule.moveError')));
            }
        } catch (error) {
            dispatch(showErrorNotification(t('schedule.moveError')));
        }
    }, [dispatch, navigate, selectedGroup, t]);

    const isAllMode = selectedGroup === 'all';
    const selectedGroupInfo = !isAllMode ? userInfo?.groups?.[selectedGroup]?.group : null;

    // Memoized: these flow into the React.memo'd EventsHour grid (~100 cells), so
    // a fresh identity on every render would defeat that memoization entirely.
    const groupsNames = useMemo(() => [
        ...(userInfo?.groups || []).map((group, idx) => ({
            title: group.group.type === groupTypeEnum.PERSONAL_TYPE
                ? `★ ${group.group.name}`
                : group.group.name,
            value: String(idx),
        })),
        { title: t('schedule.allGroups'), value: 'all' },
    ], [userInfo, t]);

    // Lightweight group context for single-group cards (author fallback → group icon).
    const groupMeta = useMemo(() => (!isAllMode && selectedGroupInfo
        ? {
            name: selectedGroupInfo.name,
            avatar: selectedGroupInfo.avatar?.location,
            isPersonal: selectedGroupInfo.type === groupTypeEnum.PERSONAL_TYPE,
        }
        : null), [isAllMode, selectedGroupInfo]);

    // Viewer timezone: schedule times are stored in the group's timezone
    // (group.parameters.gmt); the table shifts them by (user gmt − group gmt).
    const userGmt = Number.isFinite(userInfo?.gmt) ? userInfo.gmt : 0;
    const gmtDelta = userGmt - (Number.isFinite(selectedGroupInfo?.parameters?.gmt)
        ? selectedGroupInfo.parameters.gmt
        : 0);
    // Per-group deltas for "all groups" mode, where each event carries its groupId.
    const gmtDeltaByGroup = useMemo(() => {
        const map = {};
        (userInfo?.groups || []).forEach(({ group }) => {
            if (!group?._id) return;
            const groupGmt = Number.isFinite(group.parameters?.gmt) ? group.parameters.gmt : 0;
            map[String(group._id)] = userGmt - groupGmt;
        });
        return map;
    }, [userInfo, userGmt]);

    if (!userInfo?.nickname) {
        return <Loader />;
    }

    const selectedGroupRole = !isAllMode ? userInfo.groups[selectedGroup]?.role : null;
    const isGroupAdmin = selectedGroupRole === roleEnum.ADMIN_ROLE
        || selectedGroupRole === roleEnum.OWNER_ROLE;
    // Only owner/admin/help_admin may create or edit events. In "all groups" mode
    // there's no single target group, so editing is disabled there too.
    const canEdit = !isAllMode && canEditEvents(selectedGroupRole);
    const groupInfo = selectedGroupInfo || { name: isAllMode ? t('schedule.allGroups') : '', _id: null, parameters: {} };
    const periodStartEvent = groupInfo.parameters?.periodStartEvent || '8:00';
    const periodEndEvent = groupInfo.parameters?.periodEndEvent || '21:00';

    // Group options for the "all groups" multi-select in the filter
    const groupFilterOptions = userInfo.groups
        .map((g) => g.group)
        .filter(Boolean)
        .map((g) => ({ value: g._id, label: g.name }));

    // Filter options span every cached week across all the user's groups (no extra requests)
    const filterSources = [
        ...schedules.map((s) => ({ data: s.data })),
        ...(existingItem ? [existingItem] : []),
    ];

    const staticWeeksCount = existingItem?.data?.staticWeeksCount ?? 0;

    // Types/tags already used in the group's events, so custom ones created earlier
    // stay selectable (and Ukrainian tags become searchable) in the event form.
    const { extraTypes, extraTags } = (() => {
        const typeMap = new Map();
        const tagSet = new Set();
        const scan = (data) => {
            ['staticWeek', 'dynamicWeek'].forEach((k) => (data?.[k] || []).forEach((day) => (day.events || []).forEach((ev) => {
                const ei = ev.eventInfo;
                if (!ei) return;
                if (ei.type) {
                    const key = ei.type.toLowerCase();
                    if (!typeMap.has(key)) typeMap.set(key, { name: ei.type, color: ei.color || colorForType(ei.type) });
                }
                const tags = Array.isArray(ei.tag) ? ei.tag : (ei.tag ? [ei.tag] : []);
                tags.forEach((tg) => tg && tagSet.add(tg));
            })));
        };
        schedules.forEach((s) => scan(s.data));
        if (existingItem) scan(existingItem.data);
        return { extraTypes: [...typeMap.values()], extraTags: [...tagSet] };
    })();

    return (
        <div className={classes.schedule}>
            <ScheduleTour enabled={!isLoading} canEdit={canEdit} />
            <div className={classes.filterBar}>
                <span data-tour="schedule-group" style={{ display: 'inline-flex' }}>
                    <Dropdown
                        key={`group-dd-${selectedGroup}`}
                        color="green"
                        borderRadius={5}
                        defaultIndex={selectedGroup === 'all' ? groupsNames.length - 1 : selectedGroup}
                        label={t('schedule.group')}
                        arrValue={groupsNames}
                        changeValueHandler={(val) => setSelectedGroup(val === 'all' ? 'all' : Number(val))}
                    />
                </span>
                <Calendar
                    color="green"
                    resultFn={handleCalendarDateChange}
                    onViewChange={handleCalendarDateChange}
                    maxYear={calendarEnum.currentYear + 3}
                    currentDate={date.toISOString()}
                />
                <div className={classes.filterBox}>
                    <ScheduleFilter
                        scheduleWeek={filterSources}
                        activeFilter={activeFilter}
                        onChange={setActiveFilter}
                        groupOptions={isAllMode ? groupFilterOptions : null}
                    />
                </div>
            </div>

            <div className={classes.eventTable}>
                <h1 className={classes.title}>{groupInfo.name}</h1>
                <div className={classes.settingBar}>
                    <div className={classes.monthHandler}>
                        <h3 className={classes.monthTitle}>{formattedMonth}</h3>
                        <ButtonSmall
                            centerImg="chevron-pink"
                            className={classes.button}
                            onClick={handlePrevWeek}
                            style={{ transform: 'rotate(90deg)' }}
                        />
                        <ButtonSmall
                            centerImg="chevron-pink"
                            className={classes.button}
                            onClick={handleNextWeek}
                            style={{ transform: 'rotate(-90deg)' }}
                        />
                    </div>

                    <div className={classes.buttonBox}>
                        <span data-tour="schedule-assistant" style={{ display: 'inline-flex' }}>
                            <ButtonSmall centerImg={logo} onClick={openAssistant} />
                        </span>
                        <ButtonSmall
                            centerImg={squareIcons[timeSheet]}
                            onClick={timeSheetChangeHandler}
                            typeColor="green"
                        />
                        {isGroupAdmin && (
                            <ButtonSmall
                                centerImg="gear"
                                typeColor="green"
                                onClick={() => setIsModalSettings(true)}
                                isDisable={isAllMode}
                            />
                        )}
                        {canEdit && (
                            <>
                                <input
                                    ref={importInputRef}
                                    type="file"
                                    accept=".ics,text/calendar"
                                    style={{ display: 'none' }}
                                    onChange={handleImportFile}
                                />
                                <Button
                                    typeColor="green"
                                    beforeImg="plus"
                                    onClick={() => importInputRef.current?.click()}
                                    disabled={isImporting}
                                >
                                    {isImporting ? t('schedule.importing') : t('schedule.import')}
                                </Button>
                            </>
                        )}
                        {canEdit && (
                            <span data-tour="schedule-create" style={{ display: 'inline-flex' }}>
                                <Button afterImg="plus" onClick={handleOpenCreateModal}>
                                    {t('schedule.createEvent')}
                                </Button>
                            </span>
                        )}
                    </div>
                </div>

                {!isAllMode && !canViewSchedule(selectedGroupRole) ? (
                    <div className={classes.emptyState}>
                        {t('schedule.noAccess')}
                    </div>
                ) : isLoading ? (
                    <Loader />
                ) : existingItem ? (
                    <EventTable
                        date={date}
                        timeSheet={(timeSheet + 1) * calendarEnum.TS}
                        periodStartEvent={periodStartEvent}
                        periodEndEvent={periodEndEvent}
                        scheduleWeek={existingItem}
                        activeFilter={activeFilter}
                        groupMeta={groupMeta}
                        isAllMode={isAllMode}
                        gmtDelta={gmtDelta}
                        gmtDeltaByGroup={gmtDeltaByGroup}
                        onEditEvent={canEdit ? (ev) => { setEditEventData(ev); setIsModalEvent(true); } : undefined}
                        onDeleteEvent={canEdit ? requestDeleteEvent : undefined}
                        onMoveEvent={canEdit ? handleMoveEvent : undefined}
                    />
                ) : (
                    <div className={classes.emptyState}>{t('schedule.noEvents')}</div>
                )}

                {isModalEvent && (
                    <ModalCreateEvent
                        modalClose={() => setIsModalEvent(false)}
                        groupId={editEventData?.groupId || groupInfo._id}
                        refreshSchedule={() => refreshScheduleRef.current(true)}
                        editEventData={editEventData}
                        baseDate={date}
                        staticWeeksCount={staticWeeksCount}
                        periodStartEvent={periodStartEvent}
                        periodEndEvent={periodEndEvent}
                        extraTypes={extraTypes}
                        extraTags={extraTags}
                    />
                )}

                {isModalSettings && (
                    <ModalScheduleSettings
                        modalClose={() => setIsModalSettings(false)}
                        groupId={groupInfo._id}
                        parameters={groupInfo.parameters || {}}
                        refreshSchedule={() => refreshScheduleRef.current(true)}
                    />
                )}

                {eventToDelete && (
                    <ConfirmModal
                        title={t('schedule.deleteEventTitle')}
                        message={t('schedule.deleteEventMessage')}
                        confirmText={t('common.delete')}
                        onConfirm={() => {
                            const ev = eventToDelete;
                            setEventToDelete(null);
                            handleDeleteEvent(ev);
                        }}
                        onCancel={() => setEventToDelete(null)}
                    />
                )}

                {isModalassistant && (
                    <Modalassistant
                        modalClose={closeAssistant}
                        groupInfo={groupInfo}
                        userInfo={userInfo}
                        date={date}
                        onScheduleMutated={handleAssistantMutation}
                    />
                )}

                {assistantRefreshCount > 0 && (
                    <ConfirmModal
                        title={t('schedule.assistantRefreshTitle')}
                        message={t('schedule.assistantRefreshMessage', { count: assistantRefreshCount })}
                        confirmText={t('schedule.refreshNow')}
                        onConfirm={() => {
                            setAssistantRefreshCount(0);
                            refreshScheduleRef.current(true);
                        }}
                        onCancel={() => setAssistantRefreshCount(0)}
                    />
                )}
            </div>
        </div>
    );
};

export default SchedulePage;
