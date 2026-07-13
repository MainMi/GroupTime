import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import classes from './ModalFreeSlots.module.scss';
import Modal from '../../../UI/Modal/Modal';
import Button from '../../../UI/Button/Button';
import Input from '../../../UI/Input/Input';
import Checkbox from '../../../UI/Checkbox/Checkbox';
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

    // Member mode: pick a group, then search a member of it.
    const [memberGroupId, setMemberGroupId] = useState(defaultGroupId || groups[0]?._id || '');
    const [members, setMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [memberQuery, setMemberQuery] = useState('');
    const [selectedMember, setSelectedMember] = useState('');

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showBusy, setShowBusy] = useState(false);

    const toggleGroup = useCallback((id) => {
        setResult(null);
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }, []);

    // Load the chosen group's members when in member mode.
    useEffect(() => {
        if (mode !== 'member' || !memberGroupId) return undefined;
        let alive = true;
        setMembersLoading(true);
        setMembers([]);
        setSelectedMember('');
        setMemberQuery('');
        setResult(null);
        (async () => {
            const res = await fetchGroupInfo(memberGroupId, navigate);
            if (!alive) return;
            const list = (res?.data?.users || [])
                .filter((m) => m?.user?._id && m.type !== 'not verified')
                .map((m) => ({
                    id: m.user._id,
                    name: [m.user.firstName, m.user.lastName].filter(Boolean).join(' ')
                        || m.user.nickname || '—',
                    nickname: m.user.nickname || '',
                }));
            setMembers(list);
            setMembersLoading(false);
        })();
        return () => { alive = false; };
    }, [mode, memberGroupId, navigate]);

    const shownMembers = useMemo(() => {
        const q = memberQuery.trim().toLowerCase();
        if (!q) return members;
        return members.filter((m) => m.name.toLowerCase().includes(q)
            || m.nickname.toLowerCase().includes(q));
    }, [members, memberQuery]);

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
                res = await getMemberFreeSlots(
                    { groupId: memberGroupId, userId: selectedMember, date },
                    navigate
                );
            }
            if (res && res.ok !== false && res.data) setResult(res.data);
            else dispatch(showErrorNotification(t('schedule.fsError')));
        } catch (e) {
            dispatch(showErrorNotification(t('schedule.fsError')));
        } finally {
            setLoading(false);
        }
    }, [mode, selectedIds, selectedMember, memberGroupId, date, navigate, dispatch, t]);

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

                        {groups.length > 1 && (
                            <div className={classes.groupChips}>
                                {groups.map((g) => (
                                    <button
                                        key={g._id}
                                        type="button"
                                        className={`${classes.groupChip} ${memberGroupId === g._id ? classes.groupChipActive : ''}`}
                                        onClick={() => setMemberGroupId(g._id)}
                                    >
                                        {g.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        <Input
                            placeholder={t('schedule.fsSearchMember')}
                            value={memberQuery}
                            onChange={(e) => setMemberQuery(e.target.value)}
                        />

                        {membersLoading ? (
                            <Loader />
                        ) : !members.length ? (
                            <p className={classes.note}>{t('schedule.fsNoMembers')}</p>
                        ) : !shownMembers.length ? (
                            <p className={classes.note}>{t('schedule.fsNoMemberMatch')}</p>
                        ) : (
                            <ul className={classes.memberList}>
                                {shownMembers.map((m) => (
                                    <li key={m.id}>
                                        <button
                                            type="button"
                                            className={`${classes.member} ${selectedMember === m.id ? classes.memberActive : ''}`}
                                            onClick={() => { setSelectedMember(m.id); setResult(null); }}
                                        >
                                            <span className={classes.memberName}>{m.name}</span>
                                            {m.nickname && <span className={classes.memberNick}>@{m.nickname}</span>}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                )}

                <div className={classes.actions}>
                    <Button
                        typeColor="green"
                        beforeImg="free-time"
                        onClick={handleFind}
                        disabled={loading || !canFind}
                    >
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
                                    <span className={classes.dayName}>{t(`assistant.weekday.${d}`, d)}</span>
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
