import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import classes from './ModalScheduleStats.module.scss';
import Modal from '../../../UI/Modal/Modal';
import Button from '../../../UI/Button/Button';
import { computeScheduleStats } from '../../../helper/scheduleStats';

// Workload statistics for the week currently on screen: total time, a breakdown
// per event type and tag, and the busiest days. Computed from the already-loaded
// week data — no extra request, no charting dependency (plain proportional bars).
const ModalScheduleStats = ({ modalClose, data, title }) => {
    const { t } = useTranslation();

    const stats = useMemo(() => computeScheduleStats(data), [data]);

    const fmt = (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        const parts = [];
        if (h) parts.push(`${h}${t('schedule.unitH')}`);
        if (m || !h) parts.push(`${m}${t('schedule.unitM')}`);
        return parts.join(' ');
    };

    const dayName = (code) => t(`assistant.weekday.${code}`, code);

    const maxType = Math.max(1, ...stats.types.map((x) => x.minutes));
    const maxTag = Math.max(1, ...stats.tags.map((x) => x.minutes));
    const maxDay = Math.max(1, ...stats.days.map((x) => x.minutes));

    const Bar = ({ label, minutes, max, color }) => (
        <div className={classes.barRow}>
            <span className={classes.barLabel} title={label}>{label}</span>
            <div className={classes.barTrack}>
                <div
                    className={classes.barFill}
                    style={{ width: `${Math.round((minutes / max) * 100)}%`, background: color || 'var(--clr-green, #2bb673)' }}
                />
            </div>
            <span className={classes.barValue}>{fmt(minutes)}</span>
        </div>
    );

    const hasData = stats.eventCount > 0;

    return (
        <Modal onHiddenCart={modalClose} modalClassname={classes.modal}>
            <div className={classes.content}>
                <h3 className={classes.title}>{t('schedule.statsTitle')}</h3>
                {title && <p className={classes.subtitle}>{title}</p>}

                {!hasData ? (
                    <p className={classes.empty}>{t('schedule.statNoData')}</p>
                ) : (
                    <>
                        <div className={classes.totals}>
                            <div className={classes.totalMain}>
                                <span className={classes.totalValue}>{fmt(stats.totalMinutes)}</span>
                                <span className={classes.totalLabel}>{t('schedule.statTotal')}</span>
                            </div>
                            <span className={classes.count}>{t('schedule.statEvents', { count: stats.eventCount })}</span>
                        </div>

                        <section className={classes.section}>
                            <h4 className={classes.sectionTitle}>{t('schedule.statByType')}</h4>
                            {stats.types.map((x) => (
                                <Bar key={x.name} label={x.name} minutes={x.minutes} max={maxType} color={x.color} />
                            ))}
                        </section>

                        <section className={classes.section}>
                            <h4 className={classes.sectionTitle}>{t('schedule.statByDay')}</h4>
                            {stats.days.map((x) => (
                                <Bar key={x.day} label={dayName(x.day)} minutes={x.minutes} max={maxDay} />
                            ))}
                        </section>

                        {stats.tags.length > 0 && (
                            <section className={classes.section}>
                                <h4 className={classes.sectionTitle}>{t('schedule.statByTag')}</h4>
                                {stats.tags.map((x) => (
                                    <Bar key={x.name} label={x.name} minutes={x.minutes} max={maxTag} color="#9B6DD6" />
                                ))}
                            </section>
                        )}
                    </>
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

export default ModalScheduleStats;
