import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModalShowEvents from '../ModalShowEvents/ModalShowEvents';
import { colorForType } from '../../../constants/type/eventEnum';
import { ORDERED_BACKEND_DAYS } from '../../../constants/scheduleEnum';
import { getISOWeekNumber, atNoon } from '../../../helper/dateHelper';
import { getScheduleWeekInfo } from '../../../api/scheduleFetch';
import classes from './MonthView.module.scss';

const MAX_CHIPS = 3;

// Backend weekday code ('Пн'…'Вс') for a JS date (Monday-first).
const dayCodeOf = (d) => ORDERED_BACKEND_DAYS[(d.getDay() + 6) % 7];

const sameDay = (a, b) => a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// 6×7 grid of dates (Monday-first) covering the month `date` sits in, padded with
// the surrounding days so every row is a full week.
const buildMonthGrid = (date) => {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7)); // back to Monday
    return Array.from({ length: 42 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
    });
};

// Month overview: reuses the week feed — each calendar date resolves to an ISO
// week whose data the backend already returns fully resolved, so we just fetch
// each needed week once (cached in redux) and place events on their weekday.
const MonthView = ({ date, targetGroups }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const schedules = useSelector((state) => state.schedule.schedules);

    const [dayEvents, setDayEvents] = useState(null);

    const cells = useMemo(() => buildMonthGrid(date), [date]);
    const month = date.getMonth();
    const today = useMemo(() => atNoon(new Date()), []);

    const groupsKey = (targetGroups || []).map((g) => g._id).join(',');
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

    // Fetch every (week, group) the grid needs that isn't already cached. Keyed on
    // month+groups only (not `schedules`) so dispatching results doesn't re-trigger.
    const requestedRef = useRef(new Set());
    useEffect(() => {
        const weeksByRepresentative = new Map(); // isoWeek -> a date in it
        cells.forEach((d) => {
            const iso = getISOWeekNumber(d);
            if (!weeksByRepresentative.has(iso)) weeksByRepresentative.set(iso, d);
        });
        weeksByRepresentative.forEach((repDate, iso) => {
            (targetGroups || []).forEach((g) => {
                const gid = String(g._id);
                const has = schedules.some((s) => s.isoWeek === iso && String(s.groupId) === gid);
                const reqKey = `${iso}|${gid}`;
                if (!has && !requestedRef.current.has(reqKey)) {
                    requestedRef.current.add(reqKey);
                    dispatch(getScheduleWeekInfo({ date: repDate, groupId: gid }, navigate));
                }
            });
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monthKey, groupsKey]);

    // Events on a given calendar date across all target groups (tagged with group).
    const eventsForDate = (d) => {
        const iso = getISOWeekNumber(d);
        const code = dayCodeOf(d);
        const out = [];
        (targetGroups || []).forEach((g) => {
            const gid = String(g._id);
            const cached = schedules.find((s) => s.isoWeek === iso && String(s.groupId) === gid);
            if (!cached?.data) return;
            ['staticWeek', 'dynamicWeek'].forEach((key) => (cached.data[key] || []).forEach((day) => {
                if (day.day !== code) return;
                (day.events || []).forEach((ev) => {
                    if (ev?.eventInfo && ev?.eventDate) {
                        out.push({ ...ev, groupId: gid, groupName: g.name, intervalTime: ev.eventDate.time });
                    }
                });
            }));
        });
        return out.sort((a, b) => String(a.eventDate?.time).localeCompare(String(b.eventDate?.time)));
    };

    const weekdayLabels = ORDERED_BACKEND_DAYS.map((c) => t(`assistant.weekday.${c}`, c));

    return (
        <div className={classes.month}>
            <div className={classes.weekHeader}>
                {weekdayLabels.map((lbl, i) => (
                    <div key={ORDERED_BACKEND_DAYS[i]} className={classes.weekHeaderCell}>{lbl}</div>
                ))}
            </div>
            <div className={classes.grid}>
                {cells.map((d) => {
                    const events = eventsForDate(d);
                    const inMonth = d.getMonth() === month;
                    const isToday = sameDay(d, today);
                    return (
                        <button
                            type="button"
                            key={d.toISOString()}
                            className={`${classes.cell} ${inMonth ? '' : classes.outMonth} ${isToday ? classes.today : ''}`}
                            onClick={() => events.length && setDayEvents(events)}
                        >
                            <span className={classes.dayNum}>{d.getDate()}</span>
                            <span className={classes.chips}>
                                {events.slice(0, MAX_CHIPS).map((ev, idx) => (
                                    <span
                                        key={`${ev.eventInfo._id}-${idx}`}
                                        className={classes.chip}
                                        style={{ background: ev.eventInfo.color || colorForType(ev.eventInfo.type) }}
                                        title={`${ev.eventDate.time} ${ev.eventInfo.name}`}
                                    >
                                        {ev.eventDate.time} {ev.eventInfo.name}
                                    </span>
                                ))}
                                {events.length > MAX_CHIPS && (
                                    <span className={classes.more}>{t('schedule.moreEvents', { count: events.length - MAX_CHIPS })}</span>
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>

            {dayEvents && (
                <ModalShowEvents
                    events={dayEvents}
                    onHiddenCart={() => setDayEvents(null)}
                />
            )}
        </div>
    );
};

export default MonthView;
