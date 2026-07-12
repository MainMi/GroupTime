import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EventTable from '../../components/Schedule/EventTable/EventTable';
import ButtonSmall from '../../UI/Button/ButtonSmall';
import Loader from '../../UI/Loader/Loader';
import calendarEnum from '../../constants/calendarEnum';
import { EMPTY_FILTER } from '../../helper/scheduleFilter';
import { atNoon } from '../../helper/dateHelper';
import urlEnum from '../../constants/urlEnum';
import classes from './Schedule.module.scss';

// Read-only, unauthenticated schedule reached via a group's share token
// (/schedule/public/:token). Fetches the public JSON feed directly (no auth) and
// renders the same week grid as the app, minus every editing affordance.
const PublicSchedulePage = () => {
    const { token } = useParams();
    const { t, i18n } = useTranslation();

    const [date, setDate] = useState(() => atNoon(new Date()));
    const [payload, setPayload] = useState(null);
    const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'notfound'

    useEffect(() => {
        let alive = true;
        setStatus('loading');
        (async () => {
            try {
                const res = await fetch(`${urlEnum.schedulePublic}/${token}?date=${date.toISOString()}`);
                if (!alive) return;
                if (!res.ok) { setStatus('notfound'); return; }
                const data = await res.json();
                setPayload(data);
                setStatus('ok');
            } catch (e) {
                if (alive) setStatus('notfound');
            }
        })();
        return () => { alive = false; };
    }, [token, date]);

    const shiftWeek = useCallback((delta) => {
        setDate((prev) => {
            const d = new Date(prev);
            d.setDate(d.getDate() + delta * 7);
            return atNoon(d);
        });
    }, []);

    const group = payload?.group;
    const scheduleWeek = useMemo(() => ({
        data: { staticWeek: payload?.staticWeek || [], dynamicWeek: payload?.dynamicWeek || [] },
        ok: true,
    }), [payload]);

    const groupMeta = useMemo(() => (group
        ? { name: group.name, avatar: undefined, isPersonal: false }
        : null), [group]);

    const monthLocale = i18n.language?.startsWith('en') ? 'en-US' : 'uk-UA';
    const monthName = date.toLocaleString(monthLocale, { month: 'long' });
    const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    if (status === 'loading' && !payload) return <Loader />;
    if (status === 'notfound') {
        return (
            <div className={classes.schedule}>
                <div className={classes.emptyState}>{t('publicSchedule.notFound')}</div>
            </div>
        );
    }

    return (
        <div className={classes.schedule}>
            <div className={classes.eventTable}>
                <h1 className={classes.title}>{group?.name} · {t('publicSchedule.readOnly')}</h1>
                <div className={classes.settingBar}>
                    <div className={classes.monthHandler}>
                        <h3 className={classes.monthTitle}>{formattedMonth}</h3>
                        <ButtonSmall
                            centerImg="chevron-pink"
                            onClick={() => shiftWeek(-1)}
                            style={{ transform: 'rotate(90deg)' }}
                        />
                        <ButtonSmall
                            centerImg="chevron-pink"
                            onClick={() => shiftWeek(1)}
                            style={{ transform: 'rotate(-90deg)' }}
                        />
                    </div>
                </div>

                <EventTable
                    date={date}
                    timeSheet={calendarEnum.TS * 2}
                    periodStartEvent={group?.periodStartEvent || '8:00'}
                    periodEndEvent={group?.periodEndEvent || '21:00'}
                    scheduleWeek={scheduleWeek}
                    activeFilter={EMPTY_FILTER}
                    groupMeta={groupMeta}
                    isAllMode={false}
                    gmtDelta={0}
                />
            </div>
        </div>
    );
};

export default PublicSchedulePage;
