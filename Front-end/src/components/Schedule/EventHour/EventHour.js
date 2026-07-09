import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import classes from './EventHour.module.scss';
import Button from '../../../UI/Button/Button';
import AvatarImg from '../../../UI/AvatarImg/AvatarImg';
import { colorForType, DEFAULT_TYPE_COLOR } from '../../../constants/type/eventEnum';

function getEventColor(event) {
    if (!event?.eventInfo) return DEFAULT_TYPE_COLOR;
    return event.eventInfo.color || colorForType(event.eventInfo.type);
}

function eventColorStyle(color, isStatic) {
    const style = {
        backgroundColor: `${color}22`,
        borderColor: color,
    };
    if (isStatic) style.borderLeft = `3px solid ${color}`;
    else style.borderTop = `2px dashed ${color}`;
    return style;
}

// Who a card should attribute the event to: its author when known, otherwise the
// owning group (in "all groups" mode the group travels on the event itself).
function getOrigin(event, groupMeta, isAllMode) {
    const author = event?.eventInfo?.createdBy;
    if (author) {
        return { src: author.avatar?.location || null, label: author.firstName || author.nickname || '' };
    }
    if (isAllMode) {
        return { src: event?.groupAvatar || null, label: event?.groupName || '' };
    }
    if (groupMeta) {
        return { src: groupMeta.avatar || null, label: groupMeta.name || '' };
    }
    return null;
}

const OriginBadge = ({ origin }) => {
    if (!origin) return null;
    return (
        <span className={classes.origin}>
            <AvatarImg size={18} src={origin.src} className={classes.originAvatar} />
            {origin.label && <span className={classes.originLabel}>{origin.label}</span>}
        </span>
    );
};

// A single event card. When `canDrag`, it becomes a dnd-kit draggable so it can be
// dropped onto another time slot to reschedule (a click still opens the modal —
// the pointer sensor's activation distance separates click from drag).
const SingleEventCard = ({ ev, showModalFn, addEventInfoFn, groupMeta, isAllMode, canDrag, t }) => {
    const color = getEventColor(ev);
    const staticClass = ev.isStatic ? classes.static : classes.dynamic;
    const origin = getOrigin(ev, groupMeta, isAllMode);
    const showGroupChip = isAllMode && ev.eventInfo?.createdBy && ev.groupName;

    const {
        setNodeRef, listeners, attributes, isDragging,
    } = useDraggable({
        id: `ev-${ev.eventInfo?._id}-${ev.eventDate?._id}`,
        data: { ev },
        disabled: !canDrag,
    });

    // The dragged copy lives in the DragOverlay, so the source stays put (no
    // per-move transform) and just dims — this is what keeps dragging smooth.
    const style = {
        ...eventColorStyle(color, ev.isStatic),
        opacity: isDragging ? 0.35 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            {...(canDrag ? listeners : {})}
            {...(canDrag ? attributes : {})}
            onClick={() => { showModalFn(); addEventInfoFn([ev]); }}
            className={`${classes.event} ${staticClass}`}
            style={style}
        >
            {showGroupChip && <span className={classes.groupChip}>{ev.groupName}</span>}
            <span className={classes.title}>{ev.eventInfo?.name || t('schedule.untitled')}</span>
            <span className={classes.time}>{ev.intervalTime}</span>
            <div className={classes.footer}>
                <OriginBadge origin={origin} />
                <Button className={classes.button} backgroundColor={color} borderColor={color}>
                    {ev.eventInfo?.type || t('event.type')}
                </Button>
            </div>
        </div>
    );
};

const EventStack = ({ events, showModalFn, addEventInfoFn }) => {
    const { t } = useTranslation();
    const open = () => { showModalFn(); addEventInfoFn(events); };
    const shown = events.slice(0, 3);
    const rest = events.length - shown.length;

    return (
        <div className={classes.stack} onClick={open}>
            {shown.map((ev, idx) => {
                const color = getEventColor(ev);
                return (
                    <div key={(ev.eventInfo?._id || idx) + '-' + idx} className={classes.stackRow}>
                        <span className={classes.dot} style={{ backgroundColor: color }} />
                        <span className={classes.stackTime}>{ev.intervalTime}</span>
                        <span className={classes.stackName}>{ev.eventInfo?.name || t('schedule.untitled')}</span>
                    </div>
                );
            })}
            {rest > 0 && (
                <span className={classes.morePill}>{t('schedule.moreEvents', { count: rest })}</span>
            )}
        </div>
    );
};

const EventsHour = React.memo(({
    events, showModalFn, addEventInfoFn, groupMeta, isAllMode, dayIdx, time, canDrag,
}) => {
    const { t } = useTranslation();
    const validEvents = events ? events.filter(ev => ev?.eventInfo) : [];

    // Every slot is a drop target so an event can be moved into it.
    const { setNodeRef, isOver } = useDroppable({
        id: `cell-${dayIdx}-${time}`,
        data: { dayIdx, time },
        disabled: !canDrag,
    });
    const cellClass = `${classes.eventHour} ${isOver ? classes.dropOver : ''}`;

    if (validEvents.length === 0) {
        return <div ref={setNodeRef} className={cellClass} />;
    }

    if (validEvents.length === 1) {
        return (
            <div ref={setNodeRef} className={cellClass}>
                <SingleEventCard
                    ev={validEvents[0]}
                    showModalFn={showModalFn}
                    addEventInfoFn={addEventInfoFn}
                    groupMeta={groupMeta}
                    isAllMode={isAllMode}
                    canDrag={canDrag}
                    t={t}
                />
            </div>
        );
    }

    return (
        <div ref={setNodeRef} className={cellClass}>
            <EventStack
                events={validEvents}
                showModalFn={showModalFn}
                addEventInfoFn={addEventInfoFn}
            />
        </div>
    );
});

export default EventsHour;
