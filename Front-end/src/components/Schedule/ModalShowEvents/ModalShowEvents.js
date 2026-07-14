import { useState } from "react";
import { useTranslation } from "react-i18next";
import buttonsImages from "../../../static/image/buttonIcons";
import Button from "../../../UI/Button/Button";
import Modal from "../../../UI/Modal/Modal";
import FileTile from "../../../UI/FileTile/FileTile";
import { colorForType } from "../../../constants/type/eventEnum";
import classes from './ModalShowEvents.module.scss'

const ModalShowEvents = ({ events, onHiddenCart, onEditEvent, onDeleteEvent }) => {
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
