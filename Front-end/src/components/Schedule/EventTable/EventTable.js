import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    DndContext, DragOverlay, PointerSensor, useSensor, useSensors, pointerWithin,
} from '@dnd-kit/core';
import classes from './EventTable.module.scss';
import { generateShiftedTimeArray, getEventIntervals, addTime, shiftTimeString } from '../../../helper/dateHelper';
import EventsHour from '../EventHour/EventHour';
import ModalShowEvents from '../ModalShowEvents/ModalShowEvents';
import { ORDERED_BACKEND_DAYS } from '../../../constants/scheduleEnum';
import { eventMatchesFilter } from '../../../helper/scheduleFilter';

// Monday→Sunday day-name i18n keys, matching weekFullArr order.
const WEEK_DAY_KEYS = [
    'days.monday', 'days.tuesday', 'days.wednesday', 'days.thursday',
    'days.friday', 'days.saturday', 'days.sunday',
];
// Short forms shown on narrow screens where full names don't fit.
const WEEK_DAY_SHORT_KEYS = [
    'daysShort.monday', 'daysShort.tuesday', 'daysShort.wednesday', 'daysShort.thursday',
    'daysShort.friday', 'daysShort.saturday', 'daysShort.sunday',
];

const EventTable = ({
    timeSheet,
    date,
    periodStartEvent,
    periodEndEvent,
    scheduleWeek,
    activeFilter,
    onEditEvent,
    onDeleteEvent,
    onMoveEvent,
    groupMeta,
    isAllMode,
    gmtDelta = 0,
    gmtDeltaByGroup
}) => {

    const { t } = useTranslation();
    const [isShowEvent, setIsShowEvent] = useState(false);
    const [eventsInfo, setEventsInfo] = useState(null);

    // Require a small drag distance so a plain click still opens the event modal.
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
    const canDrag = !!onMoveEvent;
    // The event currently being dragged — rendered in a DragOverlay so only the
    // overlay follows the cursor and the 80+ grid cells don't re-render per move.
    const [activeEvent, setActiveEvent] = useState(null);

    // Stable identities — these reach every React.memo'd EventsHour cell.
    const toggleShowEventHandler = useCallback(() => setIsShowEvent((prevState) => !prevState), []);
    const addEventsInfoHandler = useCallback((events) => setEventsInfo(events), []);

    // Viewer-timezone offset (hours) for an event: per-group in "all groups" mode
    // (events carry groupId), otherwise the selected group's delta.
    const deltaFor = useCallback((event) => {
        if (event?.groupId != null && gmtDeltaByGroup && gmtDeltaByGroup[event.groupId] != null) {
            return gmtDeltaByGroup[event.groupId];
        }
        return gmtDelta || 0;
    }, [gmtDelta, gmtDeltaByGroup]);

    // Grid rows are shifted into the viewer's timezone by the same delta applied
    // to events, so the layout is identical for every viewer and only the clock
    // labels differ (a morning group event no longer falls outside the window).
    const timeSchedule = generateShiftedTimeArray(
        periodStartEvent,
        periodEndEvent,
        timeSheet,
        gmtDelta * 60
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

    // Monday (00:00) of the displayed week — the base for computing a drop target's
    // full date when an event is dragged to another day/time slot.
    const weekMonday = useMemo(() => {
        const d = new Date(date || new Date());
        const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();
        d.setDate(d.getDate() - dayOfWeek + 1);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [date]);

    const handleDragStart = ({ active }) => setActiveEvent(active.data.current?.ev || null);

    const handleDragEnd = ({ active, over }) => {
        setActiveEvent(null);
        if (!over || !onMoveEvent) return;
        const ev = active.data.current?.ev;
        const { dayIdx, time } = over.data.current || {};
        if (!ev || dayIdx == null || !time) return;

        const target = new Date(weekMonday);
        target.setDate(weekMonday.getDate() + dayIdx);
        const [h, m] = time.split(':');
        target.setHours(Number(h), Number(m), 0, 0);

        // Ignore a drop back onto the event's own current (displayed) slot — the
        // event's eventDate here already carries viewer-timezone display values.
        const [curH, curM] = String(ev.eventDate?.time || '').split(':');
        const sameDay = ev.eventDate?.day && dayIdx === ORDERED_BACKEND_DAYS.indexOf(ev.eventDate.day);
        if (sameDay && Number(curH) === Number(h) && Number(curM) === Number(m)) return;

        // The grid shows viewer-timezone slots; stored times are group-time wall
        // clock — convert the target back before sending.
        const delta = deltaFor(ev);
        if (delta) target.setMinutes(target.getMinutes() - delta * 60);

        onMoveEvent(ev, target);
    };

    const parsingDate = useMemo(() => {
        const result = {};
        const interval = timeSheet;

        Object.entries(scheduleWeek?.data || {}).forEach(([type, typeWeek]) => {
            if (!Array.isArray(typeWeek)) return;
            const isStatic = type === 'staticWeek';

            typeWeek.forEach(daySchedule => {
                const day = daySchedule.day;
                const events = daySchedule.events || [];

                events.forEach(event => {
                    if (!eventMatchesFilter(event, isStatic, activeFilter)) return;

                    // Shift stored (group-time) values into the viewer's timezone;
                    // the shift can move the event onto a neighbouring weekday.
                    const delta = deltaFor(event);
                    let displayDay = day;
                    let eventWithMeta = { ...event, isStatic };
                    if (delta) {
                        const shifted = shiftTimeString(event.eventDate.time, delta * 60);
                        const dayIdx = ORDERED_BACKEND_DAYS.indexOf(day);
                        displayDay = ORDERED_BACKEND_DAYS[(dayIdx + shifted.dayShift + 7) % 7];
                        eventWithMeta = {
                            ...eventWithMeta,
                            eventDate: { ...event.eventDate, time: shifted.time, day: displayDay },
                        };
                    }

                    const intervals = getEventIntervals(eventWithMeta, timeSchedule, interval);
                    const { time, duration } = eventWithMeta.eventDate;
                    const [hour, minute] = time.split(':');
                    const intervalTimeString = `${hour}:${minute}-${addTime(time, duration)}`;

                    if (!result[displayDay]) result[displayDay] = {};
                    intervals.forEach(intervalTime => {
                        if (!result[displayDay][intervalTime]) result[displayDay][intervalTime] = [];
                        result[displayDay][intervalTime].push({ ...eventWithMeta, intervalTime: intervalTimeString });
                    });
                });
            });
        });

        return result;
    }, [scheduleWeek, timeSchedule, timeSheet, activeFilter, deltaFor]);

    const selectedDayIdx = date
        ? (date.getDay() === 0 ? 6 : date.getDay() - 1)
        : -1;

    // On narrow screens the 7-column grid is unreadable, so the table splits into
    // a smaller window of days (7 → 3 → 1) driven by the container's real width
    // (ResizeObserver — responds to the actual space, not just the viewport).
    // The day buttons act as tabs that move the window; default = selected day.
    const [mobileDay, setMobileDay] = useState(selectedDayIdx >= 0 ? selectedDayIdx : 0);
    useEffect(() => {
        if (selectedDayIdx >= 0) setMobileDay(selectedDayIdx);
    }, [selectedDayIdx]);

    const scrollRef = useRef(null);
    const [dayCount, setDayCount] = useState(7);
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return undefined;
        // clientWidth works even in hidden/background tabs (forced layout), so
        // measure synchronously on mount, then track via ResizeObserver with a
        // window-resize fallback (RO callbacks pause while a tab is hidden).
        const measure = () => {
            const w = el.clientWidth || 0;
            setDayCount(w <= 560 ? 1 : w <= 860 ? 3 : 7);
        };
        measure();
        let ro;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(measure);
            ro.observe(el);
        }
        window.addEventListener('resize', measure);
        return () => {
            if (ro) ro.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, []);

    const windowStart = Math.max(0, Math.min(mobileDay, ORDERED_BACKEND_DAYS.length - dayCount));
    const isDayVisible = (idx) => idx >= windowStart && idx < windowStart + dayCount;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveEvent(null)}
        >
            <div className={classes.scrollArea} ref={scrollRef}>
            <div className={classes.weekInfo}>
                {WEEK_DAY_KEYS.map((dayKey, idx) => (
                    <div
                        key={dayKey}
                        onClick={() => setMobileDay(idx)}
                        className={`${classes.weekButton} ${idx === selectedDayIdx ? classes.selected : ''} ${dayCount < 7 && isDayVisible(idx) ? classes.mobileActive : ''}`}
                    >
                        <span className={classes.dayFull}>{t(dayKey)}</span>
                        <span className={classes.dayShort}>{t(WEEK_DAY_SHORT_KEYS[idx])}</span>
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
                <div
                    className={classes.table}
                    style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` }}
                >
                    {ORDERED_BACKEND_DAYS.map((day, dayIdx) => (
                        isDayVisible(dayIdx) && (
                            <div className={classes.eventRows} key={day}>
                                {timeSchedule.map((time, idx) => {
                                    return (
                                        <EventsHour
                                            showModalFn={toggleShowEventHandler}
                                            addEventInfoFn={addEventsInfoHandler}
                                            key={time + idx}
                                            events={parsingDate[day]?.[time]}
                                            groupMeta={groupMeta}
                                            isAllMode={isAllMode}
                                            dayIdx={dayIdx}
                                            time={time}
                                            canDrag={canDrag}
                                        />
                                    );
                                })}
                            </div>
                        )
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
            <DragOverlay dropAnimation={null}>
                {activeEvent ? (
                    <div className={classes.dragPreview}>
                        <span className={classes.dragTitle}>
                            {activeEvent.eventInfo?.name || t('schedule.untitled')}
                        </span>
                        <span className={classes.dragTime}>{activeEvent.intervalTime}</span>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default EventTable;