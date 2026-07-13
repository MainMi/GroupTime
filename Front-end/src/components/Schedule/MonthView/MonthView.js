import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModalShowEvents from '../ModalShowEvents/ModalShowEvents';
import Loader from '../../../UI/Loader/Loader';
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

// Month overview. Reuses the week feed: every calendar date belongs to an ISO week
// the backend already returns fully resolved, so the month just pulls in each week
// it needs (cached in redux) and drops events onto their weekday.
const MonthView = ({ date, targetGroups }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const schedules = useSelector((state) => state.schedule.schedules);

    const [dayEvents, setDayEvents] = useState(null);
    const [pending, setPending] = useState(0);

    const cells = useMemo(() => buildMonthGrid(date), [date]);
    const month = date.getMonth();
    const today = useMemo(() => atNoon(new Date()), []);

    const groupsKey = (targetGroups || []).map((g) => g._id).join(',');
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

    // Every (ISO week, group) pair this month needs, with a date to fetch it by.
    const needed = useMemo(() => {
        const byWeek = new Map();
        cells.forEach((d) => {
            const iso = getISOWeekNumber(d);
            if (!byWeek.has(iso)) byWeek.set(iso, d);
        });
        const out = [];
        byWeek.forEach((repDate, iso) => {
            (targetGroups || []).forEach((g) => {
                out.push({ key: `${iso}|${String(g._id)}`, iso, groupId: String(g._id), repDate });
            });
        });
        return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monthKey, groupsKey, cells]);

    // Which of those aren't cached yet. Recomputed as results land, so the effect
    // below settles once everything is in.
    const missing = useMemo(
        () => needed.filter(({ iso, groupId }) => !schedules
            .some((s) => s.isoWeek === iso && String(s.groupId) === groupId)),
        [needed, schedules]
    );
    const missingKey = missing.map((m) => m.key).join(',');

    // Guards against re-firing a request that's already in flight (or that failed —
    // we don't retry in a loop). Reset when the month or the group set changes.
    const requestedRef = useRef(new Set());
    useEffect(() => {
        requestedRef.current = new Set();
    }, [monthKey, groupsKey]);

    useEffect(() => {
        const toFetch = missing.filter((m) => !requestedRef.current.has(m.key));
        if (!toFetch.length) return;
        toFetch.forEach((m) => requestedRef.current.add(m.key));
        setPending((n) => n + toFetch.length);
        toFetch.forEach(({ repDate, groupId }) => {
            Promise.resolve(dispatch(getScheduleWeekInfo({ date: repDate, groupId }, navigate)))
                .finally(() => setPending((n) => Math.max(0, n - 1)));
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [missingKey]);

    // Events on a calendar date across every target group (tagged with their group).
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
                        out.push({
                            ...ev, groupId: gid, groupName: g.name, intervalTime: ev.eventDate.time,
                        });
                    }
                });
            }));
        });
        return out.sort((a, b) => String(a.eventDate?.time).localeCompare(String(b.eventDate?.time)));
    };

    return (
        <div className={classes.month}>
            <div className={classes.weekHeader}>
                {ORDERED_BACKEND_DAYS.map((code) => (
                    <div key={code} className={classes.weekHeaderCell}>
                        {t(`assistant.weekday.${code}`, code)}
                    </div>
                ))}
            </div>

            <div className={classes.gridWrap}>
                {pending > 0 && (
                    <div className={classes.loading}><Loader /></div>
                )}
                <div className={classes.grid}>
                    {cells.map((d) => {
                        const events = eventsForDate(d);
                        const inMonth = d.getMonth() === month;
                        const isToday = sameDay(d, today);
                        return (
                            <button
                                type="button"
                                key={d.toISOString()}
                                className={[
                                    classes.cell,
                                    inMonth ? '' : classes.outMonth,
                                    isToday ? classes.today : '',
                                ].filter(Boolean).join(' ')}
                                onClick={() => events.length && setDayEvents(events)}
                            >
                                <span className={classes.dayNum}>{d.getDate()}</span>
                                <span className={classes.chips}>
                                    {events.slice(0, MAX_CHIPS).map((ev, idx) => (
                                        <span
                                            key={`${ev.eventInfo._id}-${idx}`}
                                            className={classes.chip}
                                            style={{ '--chip-color': ev.eventInfo.color || colorForType(ev.eventInfo.type) }}
                                            title={`${ev.eventDate.time} ${ev.eventInfo.name}`}
                                        >
                                            <span className={classes.chipTime}>{ev.eventDate.time}</span>
                                            <span className={classes.chipName}>{ev.eventInfo.name}</span>
                                        </span>
                                    ))}
                                    {events.length > MAX_CHIPS && (
                                        <span className={classes.more}>
                                            {t('schedule.moreEvents', { count: events.length - MAX_CHIPS })}
                                        </span>
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </div>
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
