import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import classes from './ModalCreateEvent.module.scss';
import Button from '../../../UI/Button/Button';
import Input from '../../../UI/Input/Input';
import Modal from '../../../UI/Modal/Modal';
import Dropdown from '../../../UI/Dropdown/Dropdown';
import eventsConst, { colorForType } from '../../../constants/type/eventEnum';
import Textarea from '../../../UI/Textarea/Textarea';
import TagInput from '../../../UI/TagInput/TagInput';
import TypeSelect from '../../../UI/TypeSelect/TypeSelect';
import FileUpload from '../../../UI/FileUpload/FileUpload';
import DatePicker from '../../../UI/DatePicker/DatePicker';
import { validateFn, isUrlOrEmptyFn } from '../../../constants/validateFn.enum';
import { DAYS, BACKEND_DAY_TO_JSDAY, JSDAY_TO_DAYS_INDEX } from '../../../constants/scheduleEnum';
import { timeStringToMinutes, getMondayOfISOWeek } from '../../../helper/dateHelper';

import { addStaticEvent, addDynamicEvent, editEvent, addFileToEvent, deleteFileFromEvent } from '../../../api/eventFetch';
import { addStaticWeekToGroup } from '../../../api/scheduleFetch';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { schedulehAction } from '../../../redux/slices/schedule-slice';
import { showSuccessNotification, showErrorNotification } from '../../../redux/actions/notification-actions';

// Build a Date in the current year with the given ISO week and JS weekday.
// jsDay: 0=Sun, 1=Mon, ..., 6=Sat (Date.getDay())
function buildDateForISOWeekAndJsDay(isoWeek, jsDay, timeStr) {
    const result = getMondayOfISOWeek(isoWeek);
    const dayOffset = jsDay === 0 ? 6 : jsDay - 1;
    result.setDate(result.getDate() + dayOffset);
    const [h, m] = timeStr.split(':');
    result.setHours(Number(h), Number(m), 0, 0);
    return result;
}

const getDropdownIndex = (arr, val) => {
    if (!arr || !val) return 0;
    const index = arr.findIndex(item => item === val || item.value === val);
    return index !== -1 ? index : 0;
};

// Map a DAYS option value (JS getDay as string) to its i18n key.
const DAY_VALUE_TO_KEY = {
    '1': 'days.monday', '2': 'days.tuesday', '3': 'days.wednesday',
    '4': 'days.thursday', '5': 'days.friday', '6': 'days.saturday', '0': 'days.sunday',
};

// Normalize a 'H:mm' / 'HH:mm' time string to 'HH:mm' (for <input type="time"> min/max).
const padTime = (t2) => {
    if (!t2) return '';
    const [h, m = '00'] = String(t2).split(':');
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const ModalCreateEvent = ({
    modalClose,
    groupId,
    refreshSchedule,
    editEventData = null,
    baseDate,
    staticWeeksCount = 0,
    periodStartEvent = '8:00',
    periodEndEvent = '21:00',
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Events may only be scheduled within the group's display window (e.g. 8:30–21:00).
    const minTime = padTime(periodStartEvent);
    const maxTime = padTime(periodEndEvent);

    const isEditMode = !!editEventData;
    const isEditStatic = isEditMode && editEventData?.isStatic === true;
    const [isSending, setIsSending] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    // Common fields
    const [valueName, setValueName] = useState('');
    const [valueTeacher, setValueTeacher] = useState('');
    const [valuePlace, setValuePlace] = useState('');
    const [valueLink, setValueLink] = useState('');
    // Type is bound to a color: { name, color }
    const [valueType, setValueType] = useState(eventsConst.type[0]);
    const [valuePlatform, setValuePlatform] = useState(eventsConst.platform[0] || 'Zoom');
    const [valueTag, setValueTag] = useState([]);
    const [valueDescription, setValueDescription] = useState('');
    const [time, setTime] = useState(padTime(periodStartEvent));
    const [duration, setDuration] = useState(90);

    // Files: staged (not yet uploaded) + existing (edit mode, already on the event)
    const [stagedFiles, setStagedFiles] = useState([]);
    const [existingFiles, setExistingFiles] = useState([]);

    // Mark fields the user has interacted with so errors only show after blur/submit
    const [touched, setTouched] = useState({});

    // Schedule type toggle (create mode only)
    const [scheduleType, setScheduleType] = useState('static');

    // Static mode: day-of-week + week selector
    const [selectedDay, setSelectedDay] = useState('1'); // Mon
    const [selectedStaticWeekValue, setSelectedStaticWeekValue] = useState('new');

    // Dynamic mode: specific date
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Pre-populate fields from editEventData
    useEffect(() => {
        if (!editEventData) return;

        setValueName(editEventData.eventInfo?.name || '');
        setValueTeacher(editEventData.eventInfo?.teacherName || '');
        setValuePlace(editEventData.eventInfo?.place || '');
        setValueLink(editEventData.eventInfo?.link || '');
        const typeName = editEventData.eventInfo?.type || eventsConst.type[0].name;
        setValueType({
            name: typeName,
            color: editEventData.eventInfo?.color || colorForType(typeName),
        });
        setValuePlatform(editEventData.eventInfo?.platform || eventsConst.platform[0]);
        const rawTag = editEventData.eventInfo?.tag;
        const tagArr = Array.isArray(rawTag)
            ? rawTag
            : (rawTag ? String(rawTag).split(',').map((t2) => t2.trim()).filter(Boolean) : []);
        setValueTag(tagArr);
        setValueDescription(editEventData.eventInfo?.description || '');
        setDuration(editEventData.eventDate?.duration || 90);
        setExistingFiles(editEventData.eventDate?.data || []);

        if (editEventData.eventDate?.time) setTime(editEventData.eventDate.time);

        if (isEditStatic) {
            // Pre-select day of week from backend enum value
            const jsDay = BACKEND_DAY_TO_JSDAY[editEventData.eventDate?.day];
            if (jsDay !== undefined) setSelectedDay(String(jsDay));
            // Pre-select the static week the event currently lives in so it can be moved
            setSelectedStaticWeekValue(String(editEventData.eventDate?.countWeek ?? 0));
        } else {
            // Pre-select the date for dynamic events
            const d = baseDate ? new Date(baseDate) : new Date();
            if (editEventData.eventDate?.day) {
                const jsDay = BACKEND_DAY_TO_JSDAY[editEventData.eventDate.day];
                if (jsDay !== undefined) {
                    const diff = jsDay - d.getDay();
                    d.setDate(d.getDate() + diff);
                }
            }
            setSelectedDate(d);
        }
    }, [editEventData, baseDate, isEditStatic]);

    // Static week options built from staticWeeksCount prop (no extra API call)
    const staticWeekOptions = useMemo(() => {
        const existing = Array.from({ length: staticWeeksCount }, (_, k) => ({
            title: t('event.weekN', { n: k + 1 }),
            value: String(k),
        }));
        return [...existing, { title: t('event.createNewWeek'), value: 'new' }];
    }, [staticWeeksCount, t]);

    // Default static week selection when options become available.
    // In edit mode the selection is driven by the event itself (see effect above).
    useEffect(() => {
        if (isEditMode) return;
        setSelectedStaticWeekValue(staticWeeksCount > 0 ? '0' : 'new');
    }, [staticWeeksCount, isEditMode]);

    // Index of the currently selected static week within the dropdown options.
    const selectedStaticWeekIndex = useMemo(() => {
        const i = staticWeekOptions.findIndex((o) => o.value === selectedStaticWeekValue);
        return i !== -1 ? i : (staticWeeksCount > 0 ? 0 : staticWeekOptions.length - 1);
    }, [staticWeekOptions, selectedStaticWeekValue, staticWeeksCount]);

    // Per-field validation. Only the name is required; teacher, place and link are
    // optional (events aren't tied to a university context) and validate only when
    // filled. Returns a map of field -> translated message ('' when valid).
    const errors = useMemo(() => {
        const e = {};

        if (validateFn.isNotEmptyFn(valueName).length) e.name = t('validation.required');
        else if (valueName.trim().length < 2 || valueName.trim().length > 50) e.name = t('validation.minMax', { min: 2, max: 50 });

        if (valuePlace.trim() && (valuePlace.trim().length < 2 || valuePlace.trim().length > 50)) {
            e.place = t('validation.minMax', { min: 2, max: 50 });
        }

        if (valueTeacher.trim() && (valueTeacher.trim().length < 2 || valueTeacher.trim().length > 50)) {
            e.teacher = t('validation.minMax', { min: 2, max: 50 });
        }

        if (isUrlOrEmptyFn(valueLink).length) e.link = t('validation.url');

        const durErr = validateFn.isNumberFn(duration, 5, 300);
        if (durErr.includes('typeError')) e.duration = t('validation.number');
        else if (durErr.includes('limitError')) e.duration = t('validation.numberRange', { min: 5, max: 300 });

        // Time must fall within the group's display window.
        if (time && (timeStringToMinutes(time) < timeStringToMinutes(minTime) || timeStringToMinutes(time) > timeStringToMinutes(maxTime))) {
            e.time = t('validation.timeRange', { start: minTime, end: maxTime });
        }

        return e;
    }, [valueName, valuePlace, valueTeacher, valueLink, duration, time, minTime, maxTime, t]);

    const isValid = Object.keys(errors).length === 0;
    const showErr = (field) => (touched[field] ? errors[field] || '' : '');
    const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

    // Determines if we show the day-of-week selector (static form) or date picker (dynamic form)
    const showStaticDayForm = isEditStatic || (!isEditMode && scheduleType === 'static');

    // Localized day options for the day-of-week dropdown.
    const localizedDays = useMemo(
        () => DAYS.map((d) => ({ value: d.value, title: t(DAY_VALUE_TO_KEY[d.value]) })),
        [t]
    );

    // Upload all staged files to the given eventDate (sequential, best-effort).
    // Returns the number of files that failed to upload so the caller can warn.
    // groupId must be sent too — the /add/file middleware checks group membership.
    const uploadStagedFiles = useCallback(async (eventDateId) => {
        if (!eventDateId || !stagedFiles.length) return 0;
        let failures = 0;
        for (const file of stagedFiles) {
            const fd = new FormData();
            fd.append('groupId', groupId);
            fd.append('eventDateId', eventDateId);
            fd.append('data', file);
            try {
                const res = await addFileToEvent(fd, navigate);
                if (!res || res.ok === false) failures += 1;
            } catch (err) {
                console.error('File upload failed:', err);
                failures += 1;
            }
        }
        return failures;
    }, [stagedFiles, navigate, groupId]);

    // Delete an already-uploaded file (edit mode).
    const handleDeleteExisting = useCallback(async (fileId) => {
        const eventDateId = editEventData?.eventDate?._id;
        if (!eventDateId) return;
        // groupId is required by the /delete/file middleware (group membership check).
        const res = await deleteFileFromEvent({ groupId, eventDateId, fileId }, navigate);
        if (res && res.ok !== false) {
            setExistingFiles((prev) => prev.filter((f) => f._id !== fileId));
        } else {
            dispatch(showErrorNotification(t('event.saveError')));
        }
    }, [editEventData, navigate, dispatch, t, groupId]);

    const submitHandler = useCallback(async (ev) => {
        ev.preventDefault();
        // Reveal any outstanding errors on submit.
        setTouched({ name: true, place: true, teacher: true, link: true, duration: true, time: true });
        if (!isValid) return;
        setIsSending(true);

        const commonFields = {
            groupId,
            name: String(valueName),
            teacherName: valueTeacher || '',
            type: valueType?.name || '',
            color: valueType?.color || '',
            place: valuePlace || '',
            platform: valuePlatform || '',
            link: valueLink || '',
            description: valueDescription || '',
            tag: Array.isArray(valueTag) ? valueTag : (valueTag ? [valueTag] : []),
            duration: Number(duration),
        };

        // Resolve a date for the chosen static week (creating a new week if needed).
        const resolveStaticWeekDate = async () => {
            let N = staticWeeksCount;
            let K;

            if (selectedStaticWeekValue === 'new') {
                const addResult = await addStaticWeekToGroup({ groupId }, navigate);
                if (!addResult || addResult.ok === false) {
                    throw new Error('Failed to create static week');
                }
                dispatch(schedulehAction.clearStaticWeeks(groupId));
                K = N; // new week countWeek = old N
                N = N + 1; // new total
            } else {
                K = Number(selectedStaticWeekValue);
            }

            const targetISOWeek = K === 0 ? N : K;
            return buildDateForISOWeekAndJsDay(targetISOWeek, Number(selectedDay), time);
        };

        try {
            let response;
            let fileFailures = 0;

            if (isEditMode) {
                let finalDate;
                if (isEditStatic) {
                    finalDate = await resolveStaticWeekDate();
                } else {
                    finalDate = new Date(selectedDate);
                    if (time) {
                        const [h, m] = time.split(':');
                        finalDate.setHours(Number(h), Number(m), 0, 0);
                    }
                }
                response = await editEvent({
                    ...commonFields,
                    date: finalDate.toString(),
                    isStatic: isEditStatic,
                    eventInfoId: editEventData.eventInfo._id,
                    eventDateId: editEventData.eventDate._id,
                }, navigate);

                if (response && response.ok !== false) {
                    fileFailures = await uploadStagedFiles(editEventData.eventDate._id);
                }

            } else if (scheduleType === 'static') {
                const finalDate = await resolveStaticWeekDate();

                response = await addStaticEvent({
                    ...commonFields,
                    date: finalDate.toString(),
                }, navigate);

                if (response && response.ok !== false) {
                    fileFailures = await uploadStagedFiles(response.data?.eventDate);
                }

            } else {
                // Dynamic event
                const finalDate = new Date(selectedDate);
                if (time) {
                    const [h, m] = time.split(':');
                    finalDate.setHours(Number(h), Number(m), 0, 0);
                }
                response = await addDynamicEvent({
                    ...commonFields,
                    date: finalDate.toString(),
                }, navigate);

                if (response && response.ok !== false) {
                    fileFailures = await uploadStagedFiles(response.data?.eventDate);
                }
            }

            if (response && response.ok !== false) {
                dispatch(showSuccessNotification(isEditMode ? t('event.updated') : t('event.created')));
                // If the event saved but some files didn't upload, warn alongside the
                // success toast (both stay visible — see the toast cap of 2).
                if (fileFailures > 0) {
                    dispatch(showErrorNotification(t('event.filesUploadError', { count: fileFailures })));
                }
                if (refreshSchedule) refreshSchedule();
                modalClose();
            } else {
                const errorMsg = response?.data?.message || t('event.saveError');
                dispatch(showErrorNotification(errorMsg));
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            dispatch(showErrorNotification(t('event.connError')));
        } finally {
            setIsSending(false);
        }
    }, [
        isValid, isEditMode, isEditStatic, editEventData, groupId,
        valueName, valueTeacher, valueType, valuePlace, valuePlatform,
        valueLink, valueTag, valueDescription, duration,
        scheduleType, selectedDay, selectedStaticWeekValue, staticWeeksCount,
        selectedDate, time, navigate, refreshSchedule, modalClose, dispatch,
        uploadStagedFiles, t,
    ]);

    return (
        <Modal onHiddenCart={modalClose} modalClassname={classes.modal}>
            <div className={classes.modalContent}>
                <form className={classes.form} onSubmit={submitHandler}>

                    {!isEditMode && (
                        <>
                            <div className={classes.typeHeading}>
                                <span>{t('event.eventType')}</span>
                                <button
                                    type="button"
                                    className={classes.helpBtn}
                                    onClick={() => setShowHelp(true)}
                                    aria-label={t('event.helpTitle')}
                                >
                                    ?
                                </button>
                            </div>
                            <div className={classes.toggleRow}>
                                <Button
                                    type="button"
                                    typeColor={scheduleType === 'static' ? 'green' : 'noBorder'}
                                    onClick={() => setScheduleType('static')}
                                >
                                    {t('event.static')}
                                </Button>
                                <Button
                                    type="button"
                                    typeColor={scheduleType === 'dynamic' ? 'green' : 'noBorder'}
                                    onClick={() => setScheduleType('dynamic')}
                                >
                                    {t('event.dynamic')}
                                </Button>
                            </div>
                        </>
                    )}

                    <div className={classes.header}>
                        <Input
                            label={t('event.name')}
                            placeholder={t('event.namePlaceholder')}
                            value={valueName}
                            onChange={(e) => setValueName(e.target.value)}
                            onBlur={() => markTouched('name')}
                            error={showErr('name')}
                            id="eventName"
                        />
                    </div>

                    <div className={classes.sectionBox}>
                        <label htmlFor="teacher">{t('event.teacher')}</label>
                        <Input
                            placeholder={t('event.teacherPlaceholder')}
                            value={valueTeacher}
                            onChange={(e) => setValueTeacher(e.target.value)}
                            onBlur={() => markTouched('teacher')}
                            error={showErr('teacher')}
                            id="teacher"
                        />

                        <label htmlFor="type">{t('event.type')}</label>
                        <TypeSelect
                            value={valueType}
                            options={eventsConst.type}
                            onChange={setValueType}
                        />

                        <label htmlFor="place">{t('event.place')}</label>
                        <Input
                            placeholder={t('event.placePlaceholder')}
                            value={valuePlace}
                            onChange={(e) => setValuePlace(e.target.value)}
                            onBlur={() => markTouched('place')}
                            error={showErr('place')}
                            id="place"
                        />

                        <label htmlFor="platform">{t('event.platform')}</label>
                        <Dropdown
                            changeValueHandler={setValuePlatform}
                            arrValue={eventsConst.platform}
                            defaultIndex={getDropdownIndex(eventsConst.platform, valuePlatform)}
                            color="green"
                            borderRadius={15}
                        />

                        <label htmlFor="link">{t('event.link')}</label>
                        <Input
                            placeholder={t('event.linkPlaceholder')}
                            value={valueLink}
                            onChange={(e) => setValueLink(e.target.value)}
                            onBlur={() => markTouched('link')}
                            error={showErr('link')}
                            id="link"
                        />

                        <label htmlFor="tag">{t('event.tags')}</label>
                        <TagInput
                            value={valueTag}
                            onChange={setValueTag}
                            suggestions={eventsConst.tag}
                            placeholder={t('event.tagPlaceholder')}
                        />

                        {showStaticDayForm ? (
                            <>
                                <label>{t('event.dayOfWeek')}</label>
                                <Dropdown
                                    key={`day-${selectedDay}`}
                                    arrValue={localizedDays}
                                    changeValueHandler={setSelectedDay}
                                    defaultIndex={JSDAY_TO_DAYS_INDEX[Number(selectedDay)] ?? 0}
                                    color="green"
                                    borderRadius={15}
                                />

                                <label>{t('event.week')}</label>
                                <Dropdown
                                    key={`sw-${staticWeeksCount}-${selectedStaticWeekValue}`}
                                    arrValue={staticWeekOptions}
                                    changeValueHandler={setSelectedStaticWeekValue}
                                    defaultIndex={selectedStaticWeekIndex}
                                    color="green"
                                    borderRadius={15}
                                />
                            </>
                        ) : (
                            <>
                                <label>{t('event.date')}</label>
                                <DatePicker
                                    isTime={false}
                                    value={selectedDate}
                                    onChange={(newDate) => setSelectedDate(newDate)}
                                />
                            </>
                        )}

                        <label>{t('event.time')}</label>
                        <Input
                            type="time"
                            value={time}
                            min={minTime}
                            max={maxTime}
                            onChange={(e) => setTime(e.target.value)}
                            onBlur={() => markTouched('time')}
                            error={showErr('time')}
                        />

                        <label>{t('event.duration')}</label>
                        <Input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            onBlur={() => markTouched('duration')}
                            error={showErr('duration')}
                        />
                    </div>

                    <div className={classes.section}>
                        <label htmlFor="description">{t('event.description')}</label>
                        <Textarea
                            id="description"
                            value={valueDescription}
                            onChange={(e) => setValueDescription(e.target.value)}
                        />
                    </div>

                    <div className={classes.section}>
                        <label>{t('event.files')}</label>
                        <FileUpload
                            staged={stagedFiles}
                            onStagedChange={setStagedFiles}
                            existing={existingFiles}
                            onDeleteExisting={isEditMode ? handleDeleteExisting : undefined}
                        />
                    </div>

                    <div className={classes.buttonGroup}>
                        <Button type="button" onClick={modalClose} typeColor="noBorder">
                            {t('common.cancel')}
                        </Button>
                        <Button typeColor="green" type="submit" disabled={!isValid || isSending}>
                            {isSending ? t('event.wait') : isEditMode ? t('event.save') : t('event.create')}
                        </Button>
                    </div>
                </form>
            </div>

            {showHelp && (
                <Modal onHiddenCart={() => setShowHelp(false)} modalClassname={classes.helpModal}>
                    <div className={classes.helpContent}>
                        <h3>{t('event.helpTitle')}</h3>
                        <p><strong>{t('event.static')}.</strong> {t('event.helpStatic')}</p>
                        <p><strong>{t('event.dynamic')}.</strong> {t('event.helpDynamic')}</p>
                        <div className={classes.helpActions}>
                            <Button type="button" typeColor="green" onClick={() => setShowHelp(false)}>
                                {t('common.close')}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </Modal>
    );
};

export default ModalCreateEvent;
