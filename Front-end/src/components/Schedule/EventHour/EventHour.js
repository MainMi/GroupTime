import React from 'react';
import classes from './EventHour.module.scss';
import Button from '../../../UI/Button/Button';
import { colorForType, DEFAULT_TYPE_COLOR } from '../../../constants/type/eventEnum';

// Resolve the color bound to an event: prefer the color stored on the event,
// fall back to the predefined type color (legacy records have no color field).
function getEventColor(event) {
    if (!event?.eventInfo) return DEFAULT_TYPE_COLOR;
    return event.eventInfo.color || colorForType(event.eventInfo.type);
}

// Build inline styles from a hex color: a light tinted background + a solid
// accent border (left for static, dashed top for dynamic). Replaces the old
// fixed SCSS color classes so any type color renders correctly.
function eventColorStyle(color, isStatic) {
    const style = {
        backgroundColor: `${color}22`,
        borderColor: color,
    };
    if (isStatic) style.borderLeft = `3px solid ${color}`;
    else style.borderTop = `2px dashed ${color}`;
    return style;
}

const EventIcon = ({ events, showModalFn, addEventInfoFn }) => {
    const orderClasses = ['first', 'second', 'third'];
    return (
        <div className={classes.eventIcon}>
            {orderClasses.map((pos, idx) => {
                if (idx >= events.length) return null;
                const ev = events[idx];
                const color = getEventColor(ev);
                const isLast = idx === events.length - 1 || idx === orderClasses.length - 1;
                return (
                    <div
                        key={pos + idx}
                        onClick={() => { showModalFn(); addEventInfoFn(events); }}
                        className={`${classes.event} ${classes[pos]}`}
                        style={eventColorStyle(color, ev.isStatic)}
                    >
                        {isLast && <h4>{events.length} події</h4>}
                    </div>
                );
            })}
        </div>
    );
};

const EventsHour = React.memo(({ events, showModalFn, addEventInfoFn }) => {
    const validEvents = events ? events.filter(ev => ev?.eventInfo) : [];

    if (validEvents.length === 0) {
        return <div className={classes.eventHour} />;
    }

    if (validEvents.length === 1) {
        const ev = validEvents[0];
        const color = getEventColor(ev);
        const staticClass = ev.isStatic ? classes.static : classes.dynamic;
        return (
            <div className={classes.eventHour}>
                <div
                    onClick={() => { showModalFn(); addEventInfoFn(validEvents); }}
                    className={`${classes.event} ${staticClass}`}
                    style={eventColorStyle(color, ev.isStatic)}
                >
                    <span className={classes.title}>{ev.eventInfo?.name || 'Без назви'}</span>
                    <span className={classes.time}>{ev.intervalTime}</span>
                    <Button className={classes.button} backgroundColor={color} borderColor={color}>
                        {ev.eventInfo?.type || 'Тип'}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={classes.eventHour}>
            <EventIcon
                events={validEvents}
                showModalFn={showModalFn}
                addEventInfoFn={addEventInfoFn}
            />
        </div>
    );
});

export default EventsHour;
