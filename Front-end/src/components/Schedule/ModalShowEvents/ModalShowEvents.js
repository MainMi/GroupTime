import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import buttonsImages from "../../../static/image/buttonIcons";
import Button from "../../../UI/Button/Button";
import Modal from "../../../UI/Modal/Modal";
import FileTile from "../../../UI/FileTile/FileTile";
import { colorForType } from "../../../constants/type/eventEnum";
import { getRsvp, setRsvp } from "../../../api/scheduleFetch";
import { showErrorNotification } from "../../../redux/actions/notification-actions";
import classes from './ModalShowEvents.module.scss'

const RSVP_OPTIONS = ['going', 'maybe', 'declined'];

// Attendance ("going / maybe / declined") for one event. Self-contained: fetches
// its own summary keyed by (groupId, eventInfoId) so switching events in the
// carousel reloads it. Any group member may respond; the active choice toggles off.
const EventRsvp = ({ groupId, eventInfoId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [summary, setSummary] = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!groupId || !eventInfoId) return undefined;
        let alive = true;
        (async () => {
            const res = await getRsvp({ groupId, eventInfoId }, navigate);
            if (alive && res?.data) setSummary(res.data);
        })();
        return () => { alive = false; };
    }, [groupId, eventInfoId, navigate]);

    const choose = useCallback(async (status) => {
        if (busy) return;
        setBusy(true);
        // Clicking the active choice clears it.
        const next = summary?.myStatus === status ? 'none' : status;
        try {
            const res = await setRsvp({ groupId, eventInfoId, status: next }, navigate);
            if (res?.data) setSummary(res.data);
            else dispatch(showErrorNotification(t('event.rsvpError')));
        } catch (e) {
            dispatch(showErrorNotification(t('event.rsvpError')));
        } finally {
            setBusy(false);
        }
    }, [busy, summary, groupId, eventInfoId, navigate, dispatch, t]);

    if (!groupId) return null;

    const counts = summary?.counts || {};
    const myStatus = summary?.myStatus || 'none';

    return (
        <div className={classes.rsvpBox}>
            <label>{t('event.rsvp')}</label>
            <div className={classes.rsvpButtons}>
                {RSVP_OPTIONS.map((status) => (
                    <button
                        key={status}
                        type="button"
                        disabled={busy}
                        className={`${classes.rsvpBtn} ${classes[`rsvp_${status}`]} ${myStatus === status ? classes.rsvpActive : ''}`}
                        onClick={() => choose(status)}
                    >
                        {t(`event.rsvp_${status}`)}
                        <span className={classes.rsvpCount}>{counts[status] || 0}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const ModalShowEvents = ({ events, onHiddenCart, onEditEvent, onDeleteEvent, fallbackGroupId }) => {
    const { t } = useTranslation();
    const [current, setCurrent] = useState(0);

    const list = Array.isArray(events) ? events : [];
    if (!list.length) return null;

    const total = list.length;
    const index = current % total;
    const ev = list[index];
    const { eventInfo, eventDate, intervalTime } = ev;
    const typeColor = eventInfo.color || colorForType(eventInfo.type);
    const files = eventDate?.data || [];
    const notFilled = t('event.notFilled');
    const rsvpGroupId = ev.groupId || fallbackGroupId;

    const go = (delta) => setCurrent((i) => (i + delta + total) % total);

    return (
        <Modal modalClassname={classes.modalContent} onHiddenCart={onHiddenCart}>
            <div className={classes.events}>
                {total > 1 && (
                    <button type="button" className={classes.navBtn} onClick={() => go(-1)} aria-label="previous">‹</button>
                )}
                <div className={classes.eventInfo}>
                    <div className={classes.titleBox}>
                        <h4>{eventInfo.name}</h4>
                        {total > 1 && <span className={classes.counter}>{index + 1} / {total}</span>}
                        <img onClick={onHiddenCart} src={buttonsImages["close-pink"]} alt="close" style={{ cursor: 'pointer' }} />
                    </div>

                    <div className={classes.sectionBox}>
                        <label>{t('event.teacher')}</label>
                        <span>{eventInfo.teacherName || notFilled}</span>

                        <label>{t('event.type')}</label>
                        <Button backgroundColor={typeColor} borderColor={typeColor}>{eventInfo.type}</Button>

                        <label>{t('event.place')}</label>
                        <span>{eventInfo.place || notFilled}</span>

                        <label>{t('event.platform')}</label>
                        <span>{eventInfo.platform || notFilled}</span>

                        <label>{t('event.link')}</label>
                        <span className={classes.link}>
                            {eventInfo.link
                                ? <a href={eventInfo.link} target="_blank" rel="noreferrer">{eventInfo.link}</a>
                                : notFilled}
                        </span>

                        <label>{t('event.tags')}</label>
                        <span className={classes.tag}>
                            {Array.isArray(eventInfo.tag)
                                ? (eventInfo.tag.length ? eventInfo.tag.join(', ') : notFilled)
                                : (eventInfo.tag || notFilled)}
                        </span>

                        <label>{t('event.time')}</label>
                        <span>{intervalTime}</span>

                        <label>{t('event.duration')}</label>
                        <span>{eventDate?.duration ? `${eventDate.duration} ${t('event.minutesShort')}` : notFilled}</span>
                    </div>
                    {eventInfo.description && (
                        <div className={classes.description}>
                            <label>{t('event.description')}</label>
                            <span>{eventInfo.description}</span>
                        </div>
                    )}

                    <EventRsvp groupId={rsvpGroupId} eventInfoId={eventInfo._id} />

                    {files.length > 0 && (
                        <div className={classes.filesBox}>
                            <label>{t('event.files')}</label>
                            <div className={classes.fileGrid}>
                                {files.map((f) => (
                                    <FileTile key={f._id || f.location} file={f} />
                                ))}
                            </div>
                        </div>
                    )}
                    {(onEditEvent || onDeleteEvent) && (
                        <div className={classes.buttonBox}>
                            {onDeleteEvent && (
                                <Button
                                    typeColor="red"
                                    onClick={() => { onHiddenCart(); onDeleteEvent(ev); }}
                                >
                                    {t('common.delete')}
                                </Button>
                            )}
                            {onEditEvent && (
                                <Button
                                    beforeImg="edit"
                                    typeColor="green"
                                    onClick={() => { onHiddenCart(); onEditEvent(ev); }}
                                >
                                    {t('common.edit')}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
                {total > 1 && (
                    <button type="button" className={classes.navBtn} onClick={() => go(1)} aria-label="next">›</button>
                )}
            </div>
        </Modal>
    );
};

export default ModalShowEvents;
