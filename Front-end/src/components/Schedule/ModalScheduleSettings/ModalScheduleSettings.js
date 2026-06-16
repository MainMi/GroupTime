import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import classes from './ModalScheduleSettings.module.scss';
import Modal from '../../../UI/Modal/Modal';
import Button from '../../../UI/Button/Button';
import ButtonSmall from '../../../UI/Button/ButtonSmall';
import Loader from '../../../UI/Loader/Loader';
import ConfirmModal from '../../../UI/ConfirmModal/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    getStaticWeeksList,
    deleteStaticWeek,
    swapStaticWeeks,
} from '../../../api/scheduleFetch';
import { editGroup } from '../../../api/groupFetch';
import { fetchUserInfo } from '../../../redux/actions/auth-actions';
import { schedulehAction } from '../../../redux/slices/schedule-slice';
import { showSuccessNotification, showErrorNotification } from '../../../redux/actions/notification-actions';
import { timeStringToMinutes, getMondayOfISOWeek, atNoon } from '../../../helper/dateHelper';

// Collapse concurrent identical fetches (e.g. React StrictMode double-mount in
// dev) for the same group into a single network request.
const inFlightWeeks = new Map();

// Half-hour options ('0:00','0:30'..'23:30') so ranges like 8:30–21:00 are possible.
const HOUR_OPTIONS = Array.from({ length: 48 }, (_, i) => `${Math.floor(i / 2)}:${i % 2 ? '30' : '00'}`);

// Build a date (Monday, noon) whose ISO week maps to the given static week index.
// The backend resolves a static week as ISO(date) % staticWeekCount, so we pick
// ISO week = index (or the total count when index === 0).
const buildStaticWeekDate = (index, total) => {
    const isoWeek = index === 0 ? total : index;
    return atNoon(getMondayOfISOWeek(isoWeek));
};

const ModalScheduleSettings = ({ modalClose, groupId, parameters = {}, refreshSchedule }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { t } = useTranslation();

    // --- Time range section ---
    const [startTime, setStartTime] = useState(parameters.periodStartEvent || '8:00');
    const [endTime, setEndTime] = useState(parameters.periodEndEvent || '21:00');
    const [isSavingRange, setIsSavingRange] = useState(false);
    const rangeInvalid = timeStringToMinutes(startTime) >= timeStringToMinutes(endTime);

    // --- Weeks section ---
    const cachedWeeks = useSelector((state) => state.schedule.staticWeeks[groupId]);
    const cachedWeeksRef = useRef(cachedWeeks);
    cachedWeeksRef.current = cachedWeeks;

    const [weeks, setWeeks] = useState(() => (Array.isArray(cachedWeeks) ? cachedWeeks : []));
    const [isLoading, setIsLoading] = useState(() => !Array.isArray(cachedWeeks));
    const [isBusy, setIsBusy] = useState(false);
    const [weekToDelete, setWeekToDelete] = useState(null);

    // Fetch the static weeks list once per group and cache it. Pass force=true to
    // bypass the cache (after a static week swap/delete, which changes the list).
    const loadWeeks = useCallback(async (force = false) => {
        if (!force && Array.isArray(cachedWeeksRef.current)) {
            setWeeks(cachedWeeksRef.current);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            let req = inFlightWeeks.get(groupId);
            if (!req) {
                req = getStaticWeeksList({ groupId }, navigate);
                inFlightWeeks.set(groupId, req);
                req.finally(() => inFlightWeeks.delete(groupId));
            }
            const res = await req;
            const list = Array.isArray(res?.data) ? [...res.data] : [];
            list.sort((a, b) => a.countWeek - b.countWeek);
            setWeeks(list);
            dispatch(schedulehAction.setStaticWeeks({ groupId, list }));
        } catch (e) {
            dispatch(showErrorNotification(t('scheduleSettings.loadWeeksError')));
        } finally {
            setIsLoading(false);
        }
    }, [groupId, navigate, dispatch, t]);

    useEffect(() => {
        loadWeeks();
    }, [loadWeeks]);

    const handleSaveRange = useCallback(async () => {
        if (rangeInvalid || isSavingRange) return;
        setIsSavingRange(true);
        try {
            // updateGroup uses $set on `parameters`, replacing the whole subdoc, so
            // send the full merged object to preserve the other parameters.
            await dispatch(editGroup({
                groupId,
                parameters: { ...parameters, periodStartEvent: startTime, periodEndEvent: endTime },
            }));
            dispatch(showSuccessNotification(t('scheduleSettings.settingsSaved')));
            // Refresh userInfo so the table picks up the new range, then the schedule.
            await dispatch(fetchUserInfo(navigate));
            if (refreshSchedule) refreshSchedule();
        } catch (e) {
            dispatch(showErrorNotification(t('scheduleSettings.settingsSaveError')));
        } finally {
            setIsSavingRange(false);
        }
    }, [rangeInvalid, isSavingRange, dispatch, groupId, parameters, startTime, endTime, navigate, refreshSchedule, t]);

    const handleSwap = useCallback(async (i, j) => {
        if (isBusy || j < 0 || j >= weeks.length) return;
        setIsBusy(true);
        try {
            const res = await swapStaticWeeks({
                groupId,
                weekId1: weeks[i]._id,
                weekId2: weeks[j]._id,
            }, navigate);
            if (res && res.ok !== false) {
                await loadWeeks(true);
                if (refreshSchedule) refreshSchedule();
            } else {
                dispatch(showErrorNotification(t('scheduleSettings.reorderError')));
            }
        } catch (e) {
            dispatch(showErrorNotification(t('errors.swapOrderFailed')));
        } finally {
            setIsBusy(false);
        }
    }, [isBusy, weeks, groupId, navigate, loadWeeks, refreshSchedule, dispatch, t]);

    const handleDeleteConfirmed = useCallback(async () => {
        if (!weekToDelete) return;
        setIsBusy(true);
        const total = weeks.length;
        const target = weekToDelete;
        setWeekToDelete(null);
        try {
            const date = buildStaticWeekDate(target.countWeek, total);
            const res = await deleteStaticWeek({ groupId, date: date.toString() }, navigate);
            if (res && res.ok !== false) {
                dispatch(showSuccessNotification(t('scheduleSettings.weekDeleted')));
                await loadWeeks(true);
                if (refreshSchedule) refreshSchedule();
            } else {
                dispatch(showErrorNotification(t('scheduleSettings.weekDeleteError')));
            }
        } catch (e) {
            dispatch(showErrorNotification(t('errors.deleteWeekFailed')));
        } finally {
            setIsBusy(false);
        }
    }, [weekToDelete, weeks.length, groupId, navigate, loadWeeks, refreshSchedule, dispatch, t]);

    return (
        <Modal onHiddenCart={modalClose} modalClassname={classes.modal}>
            <div className={classes.content}>
                <h3 className={classes.title}>{t('scheduleSettings.title')}</h3>

                <section className={classes.section}>
                    <h4 className={classes.sectionTitle}>{t('scheduleSettings.displayRange')}</h4>
                    <div className={classes.rangeRow}>
                        <label className={classes.field}>
                            <span>{t('scheduleSettings.from')}</span>
                            <select
                                className={classes.select}
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                disabled={isSavingRange}
                            >
                                {HOUR_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </label>
                        <label className={classes.field}>
                            <span>{t('scheduleSettings.to')}</span>
                            <select
                                className={classes.select}
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                disabled={isSavingRange}
                            >
                                {HOUR_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </label>
                        <Button
                            typeColor="green"
                            onClick={handleSaveRange}
                            disabled={rangeInvalid || isSavingRange}
                        >
                            {isSavingRange ? t('scheduleSettings.saving') : t('common.save')}
                        </Button>
                    </div>
                    {rangeInvalid && (
                        <p className={classes.hint}>{t('scheduleSettings.rangeError')}</p>
                    )}
                </section>

                <section className={classes.section}>
                    <h4 className={classes.sectionTitle}>{t('scheduleSettings.staticWeeks')}</h4>
                    {isLoading ? (
                        <Loader />
                    ) : weeks.length === 0 ? (
                        <p className={classes.empty}>{t('scheduleSettings.noStaticWeeks')}</p>
                    ) : (
                        <ul className={classes.list}>
                            {weeks.map((week, idx) => (
                                <li key={week._id} className={classes.row}>
                                    <span className={classes.weekName}>{t('event.weekN', { n: idx + 1 })}</span>
                                    <div className={classes.actions}>
                                        <ButtonSmall
                                            centerImg="chevron"
                                            size={14}
                                            transform="rotate(180deg)"
                                            onClick={() => handleSwap(idx, idx - 1)}
                                            isDisable={isBusy || idx === 0}
                                        />
                                        <ButtonSmall
                                            centerImg="chevron"
                                            size={14}
                                            onClick={() => handleSwap(idx, idx + 1)}
                                            isDisable={isBusy || idx === weeks.length - 1}
                                        />
                                        <Button
                                            typeColor="red"
                                            onClick={() => setWeekToDelete(week)}
                                            disabled={isBusy}
                                        >
                                            {t('common.delete')}
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <div className={classes.buttonGroup}>
                    <Button type="button" typeColor="noBorder" onClick={modalClose}>
                        {t('common.close')}
                    </Button>
                </div>
            </div>

            {weekToDelete && (
                <ConfirmModal
                    title={t('scheduleSettings.deleteWeekTitle')}
                    message={t('scheduleSettings.deleteWeekMessage')}
                    confirmText={t('common.delete')}
                    onConfirm={handleDeleteConfirmed}
                    onCancel={() => setWeekToDelete(null)}
                />
            )}
        </Modal>
    );
};

export default ModalScheduleSettings;
