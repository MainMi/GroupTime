import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import classes from './ModalFreeSlots.module.scss';
import Modal from '../../../UI/Modal/Modal';
import Button from '../../../UI/Button/Button';
import Checkbox from '../../../UI/Checkbox/Checkbox';
import Dropdown from '../../../UI/Dropdown/Dropdown';
import Loader from '../../../UI/Loader/Loader';
import { ORDERED_BACKEND_DAYS } from '../../../constants/scheduleEnum';
import { getGroupFreeSlots, getMemberFreeSlots } from '../../../api/scheduleFetch';
import { fetchGroupInfo } from '../../../api/groupFetch';
import { showErrorNotification } from '../../../redux/actions/notification-actions';

// Find a common free time across several group schedules, or check one member's
// availability. Busy is the union of the chosen schedules — a slot is "free" only
// when nobody is busy. `groups` are the requester's viewable groups.
const ModalFreeSlots = ({ modalClose, groups, defaultGroupId, date }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [mode, setMode] = useState('groups'); // 'groups' | 'member'

    // Groups mode: which of my groups to intersect (default: the one on screen, else all).
    const [selectedIds, setSelectedIds] = useState(() => (
        defaultGroupId ? [defaultGroupId] : groups.map((g) => g._id)
    ));

    // Member mode: pick a group, then a member of it.
    const [memberGroupId, setMemberGroupId] = useState(defaultGroupId || groups[0]?._id || '');
    const [members, setMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [selectedMember, setSelectedMember] = useState('');

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showBusy, setShowBusy] = useState(false);

    const dayName = useCallback((code) => t(`assistant.weekday.${code}`, code), [t]);

    const toggleGroup = useCallback((id) => {
        setResult(null);
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }, []);

    // Load the chosen group's members when in member mode.
    useEffect(() => {
        if (mode !== 'member' || !memberGroupId) return;
        let alive = true;
        setMembersLoading(true);
        setMembers([]);
        setSelectedMember('');
        setResult(null);
        (async () => {
            const res = await fetchGroupInfo(memberGroupId, navigate);
            if (!alive) return;
            const list = (res?.data?.users || [])
                .filter((m) => m?.user?._id && m.type !== 'not verified')
                .map((m) => ({
                    id: m.user._id,
                    name: [m.user.firstName, m.user.lastName].filter(Boolean).join(' ') || m.user.nickname || '—',
                }));
            setMembers(list);
            if (list.length) setSelectedMember(list[0].id);
            setMembersLoading(false);
        })();
        return () => { alive = false; };
    }, [mode, memberGroupId, navigate]);

    const handleFind = useCallback(async () => {
        setLoading(true);
        setResult(null);
        try {
            let res;
            if (mode === 'groups') {
                if (!selectedIds.length) {
                    dispatch(showErrorNotification(t('schedule.fsNoGroupsSelected')));
                    return;
                }
                res = await getGroupFreeSlots({ groupIds: selectedIds, date }, navigate);
            } else {
                if (!selectedMember) return;
                res = await getMemberFreeSlots({ groupId: memberGroupId, userId: selectedMember, date }, navigate);
            }
            if (res && res.ok !== false && res.data) setResult(res.data);
            else dispatch(showErrorNotification(t('schedule.fsError')));
        } catch (e) {
            dispatch(showErrorNotification(t('schedule.fsError')));
        } finally {
            setLoading(false);
        }
    }, [mode, selectedIds, selectedMember, memberGroupId, date, navigate, dispatch, t]);

    const groupOptions = useMemo(
        () => groups.map((g) => ({ title: g.name, value: g._id })),
        [groups]
    );
    const memberOptions = useMemo(
        () => members.map((m) => ({ title: m.name, value: m.id })),
        [members]
    );

    const hasAnyFree = result && ORDERED_BACKEND_DAYS.some((d) => (result.free?.[d] || []).length);
    const canFind = mode === 'groups' ? selectedIds.length > 0 : !!selectedMember;

    return (
        <Modal onHiddenCart={modalClose} modalClassname={classes.modal}>
            <div className={classes.content}>
                <h3 className={classes.title}>{t('schedule.freeSlotsTitle')}</h3>

                <div className={classes.tabs}>
                    <button
                        type="button"
                        className={`${classes.tab} ${mode === 'groups' ? classes.tabActive : ''}`}
                        onClick={() => { setMode('groups'); setResult(null); }}
                    >
                        {t('schedule.fsModeGroups')}
                    </button>
                    <button
                        type="button"
                        className={`${classes.tab} ${mode === 'member' ? classes.tabActive : ''}`}
                        onClick={() => { setMode('member'); setResult(null); }}
                    >
                        {t('schedule.fsModeMember')}
                    </button>
                </div>

                {mode === 'groups' ? (
                    <section className={classes.section}>
                        <p className={classes.note}>{t('schedule.fsGroupsHint')}</p>
                        <div className={classes.groupList}>
                            {groups.map((g) => (
                                <Checkbox
                                    key={g._id}
                                    typeColor="green"
                                    value={selectedIds.includes(g._id)}
                                    onChange={() => toggleGroup(g._id)}
                                >
                                    {g.name}
                                </Checkbox>
                            ))}
                        </div>
                    </section>
                ) : (
                    <section className={classes.section}>
                        <p className={classes.note}>{t('schedule.fsMemberHint')}</p>
                        <div className={classes.pickers}>
                            {groupOptions.length > 1 && (
                                <Dropdown
                                    color="green"
                                    borderRadius={5}
                                    label={t('schedule.group')}
                                    arrValue={groupOptions}
                                    defaultIndex={Math.max(0, groups.findIndex((g) => g._id === memberGroupId))}
                                    changeValueHandler={(val) => setMemberGroupId(val)}
                                />
                            )}
                            {membersLoading ? (
                                <Loader />
                            ) : members.length ? (
                                <Dropdown
                                    key={`members-${memberGroupId}`}
                                    color="green"
                                    borderRadius={5}
                                    label={t('schedule.fsSelectMember')}
                                    arrValue={memberOptions}
                                    defaultIndex={0}
                                    changeValueHandler={(val) => { setSelectedMember(val); setResult(null); }}
                                />
                            ) : (
                                <p className={classes.note}>{t('schedule.fsNoMembers')}</p>
                            )}
                        </div>
                    </section>
                )}

                <div className={classes.actions}>
                    <Button typeColor="green" onClick={handleFind} disabled={loading || !canFind}>
                        {loading ? t('schedule.fsSearching') : t('schedule.fsFind')}
                    </Button>
                    {result && (
                        <button
                            type="button"
                            className={classes.toggleBusy}
                            onClick={() => setShowBusy((v) => !v)}
                        >
                            {showBusy ? t('schedule.fsHideBusy') : t('schedule.fsShowBusy')}
                        </button>
                    )}
                </div>

                {result && (
                    <div className={classes.results}>
                        {!hasAnyFree && <p className={classes.empty}>{t('schedule.fsNoFree')}</p>}
                        {ORDERED_BACKEND_DAYS.map((d) => {
                            const free = result.free?.[d] || [];
                            const busy = result.busy?.[d] || [];
                            if (!free.length && !busy.length && !showBusy) return null;
                            return (
                                <div key={d} className={classes.dayRow}>
                                    <span className={classes.dayName}>{dayName(d)}</span>
                                    <div className={classes.slots}>
                                        {free.length ? (
                                            free.map((w, i) => (
                                                <span key={`f${i}`} className={classes.free}>
                                                    {w.start}–{w.end}
                                                </span>
                                            ))
                                        ) : (
                                            <span className={classes.full}>{t('schedule.fsDayFull')}</span>
                                        )}
                                        {showBusy && busy.map((w, i) => (
                                            <span key={`b${i}`} className={classes.busy} title={w.label || ''}>
                                                {w.start}–{w.end}{w.label ? ` · ${w.label}` : ''}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className={classes.buttonGroup}>
                    <Button type="button" typeColor="noBorder" onClick={modalClose}>
                        {t('common.close')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ModalFreeSlots;
