import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import classes from './EventTable.module.scss';
import generateTimeArray, { getEventIntervals, addTime } from '../../../helper/dateHelper';
import EventsHour from '../EventHour/EventHour';
import ModalShowEvents from '../ModalShowEvents/ModalShowEvents';
import { ORDERED_BACKEND_DAYS } from '../../../constants/scheduleEnum';
import { eventMatchesFilter } from '../../../helper/scheduleFilter';

// Monday→Sunday day-name i18n keys, matching weekFullArr order.
const WEEK_DAY_KEYS = [
    'days.monday', 'days.tuesday', 'days.wednesday', 'days.thursday',
    'days.friday', 'days.saturday', 'days.sunday',
];

const EventTable = ({
    timeSheet,
    date,
    periodStartEvent,
    periodEndEvent,
    scheduleWeek,
    activeFilter,
    onEditEvent,
    onDeleteEvent
}) => {

    const { t } = useTranslation();
    const [isShowEvent, setIsShowEvent] = useState(false);
    const [eventsInfo, setEventsInfo] = useState(null);

    const toggleShowEventHandler = () => setIsShowEvent((prevState) => !prevState);
    const addEventsInfoHandler = (events) => setEventsInfo(events);

    const timeSchedule = generateTimeArray(
        periodStartEvent,
        periodEndEvent,
        timeSheet
    );

    const weekDates = useMemo(() => {
        const d = new Date(date || new Date());
        const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay(); 
        d.setDate(d.getDate() - dayOfWeek + 1);
        
        return Array.from({ length: 7 }).map((_, i) => {
            const current = new Date(d);
            current.setDate(d.getDate() + i);
            return current.getDate();
        });
    }, [date]);

    const parsingDate = useMemo(() => {
        const result = {};
        const interval = timeSheet;

        Object.entries(scheduleWeek?.data || {}).forEach(([type, typeWeek]) => {
            if (!Array.isArray(typeWeek)) return;
            const isStatic = type === 'staticWeek';

            typeWeek.forEach(daySchedule => {
                const day = daySchedule.day;
                if (!result[day]) result[day] = {};

                const events = daySchedule.events || [];

                events.forEach(event => {
                    if (!eventMatchesFilter(event, isStatic, activeFilter)) return;
                    const eventWithMeta = { ...event, isStatic };
                    const intervals = getEventIntervals(eventWithMeta, timeSchedule, interval);
                    const { time, duration } = event.eventDate;
                    const [hour, minute] = time.split(':');
                    const intervalTimeString = `${hour}:${minute}-${addTime(time, duration)}`;

                    intervals.forEach(intervalTime => {
                        if (!result[day][intervalTime]) result[day][intervalTime] = [];
                        result[day][intervalTime].push({ ...eventWithMeta, intervalTime: intervalTimeString });
                    });
                });
            });
        });

        return result;
    }, [scheduleWeek, timeSchedule, timeSheet, activeFilter]);

    const selectedDayIdx = date
        ? (date.getDay() === 0 ? 6 : date.getDay() - 1)
        : -1;

    return (
        <>
            <div className={classes.scrollArea}>
            <div className={classes.weekInfo}>
                {WEEK_DAY_KEYS.map((dayKey, idx) => (
                    <div
                        key={dayKey}
                        className={`${classes.weekButton} ${idx === selectedDayIdx ? classes.selected : ''}`}
                    >
                        <span>{t(dayKey)}</span>
                        <span>{weekDates[idx]}</span>
                    </div>
                ))}
            </div>

            <div className={classes.tableBox}>
                <div className={classes.timeColumn}>
                    {timeSchedule.map((time, idx) => (
                        <div key={time + idx}>{time}</div>
                    ))}
                </div>
                <div className={classes.table}>
                    {ORDERED_BACKEND_DAYS.map(day => (
                        <div className={classes.eventRows} key={day}>
                            {timeSchedule.map((time, idx) => {
                                return (
                                    <EventsHour
                                        showModalFn={toggleShowEventHandler}
                                        addEventInfoFn={addEventsInfoHandler}
                                        key={time + idx}
                                        events={parsingDate[day]?.[time]}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
            </div>
            {isShowEvent && (
                <ModalShowEvents
                    events={eventsInfo}
                    onHiddenCart={toggleShowEventHandler}
                    onEditEvent={onEditEvent}
                    onDeleteEvent={onDeleteEvent}
                />
            )}
        </>
    );
};

export default EventTable;