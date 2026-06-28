// Resolves the model's "/magic" extraction into a concrete, validated action
// (or a follow-up question) plus a localized message. No DB writes here.

const { isLanguage } = require('./lang.helper');
const { norm } = require('./string.helper');
const { pick } = require('./value.helper');
const { DAY_NAMES_LONG } = require('../constant/week.text');
const { fieldLabels } = require('../constant/assistantText');
const { DEFAULT_EVENT_DURATION } = require('../constant/event.enum');

// Coerce a tag value (string | array | nullish) to a clean string array.
const toTagArray = (v) => {
    if (Array.isArray(v)) return v.map((t) => String(t).trim()).filter(Boolean);
    if (v == null || v === '') return [];
    return [String(v).trim()].filter(Boolean);
};

// Union existing + incoming tags (deduped). Editing tags ADDS to what's there —
// "/organize" and "/magic add tag …" must never silently drop existing tags.
const mergeTags = (existing, incoming) => [...new Set(toTagArray(existing).concat(toTagArray(incoming)))];

// Find an existing event (in this week's resolved data) by name.
const findEvent = (weekData, name) => {
    const target = norm(name);
    if (!target) return null;

    const scan = (schedule, isStatic) => {
        for (const day of schedule || []) {
            for (const ev of day.events || []) {
                if (ev?.eventInfo && norm(ev.eventInfo.name) === target) return { ev, isStatic };
            }
        }
        return null;
    };
    // Exact match first, then a looser "contains" pass.
    const exact = scan(weekData?.staticWeek, true) || scan(weekData?.dynamicWeek, false);
    if (exact) return exact;

    const scanLoose = (schedule, isStatic) => {
        for (const day of schedule || []) {
            for (const ev of day.events || []) {
                const n = norm(ev?.eventInfo?.name);
                if (n && (n.includes(target) || target.includes(n))) return { ev, isStatic };
            }
        }
        return null;
    };
    return scanLoose(weekData?.staticWeek, true) || scanLoose(weekData?.dynamicWeek, false);
};

// Build the human-readable "when" part for the confirmation summary.
const whenText = (scheduleType, ev, lang) => {
    const uk = isLanguage(lang, 'uk');
    const dayMap = uk ? DAY_NAMES_LONG.uk : DAY_NAMES_LONG.en;
    if (scheduleType === 'dynamic' && ev.date) {
        return `${ev.date}${ev.time ? `, ${ev.time}` : ''}`;
    }
    const day = ev.day ? (dayMap[ev.day] || ev.day) : '';
    return `${day}${ev.time ? `, ${ev.time}` : ''}`;
};

// Resolve a SINGLE extracted entry into { action, reply }. `action` is null when
// more input is needed (reply then explains what's missing / asks to clarify).
const resolveOne = (parsed, groups, lang) => {
    const uk = isLanguage(lang, 'uk');
    const labels = uk ? fieldLabels.uk : fieldLabels.en;
    const intent = parsed?.intent;

    if (intent !== 'create' && intent !== 'edit') {
        return {
            action: null,
            reply: parsed?.reply || (uk
                ? 'Я можу створити або відредагувати подію. Опишіть, що зробити (через команду /magic).'
                : 'I can create or edit an event. Describe what to do (using the /magic command).'),
        };
    }

    // --- Resolve the target group ---
    let group = null;
    if (parsed.groupName) {
        group = groups.find((g) => norm(g.name) === norm(parsed.groupName))
            || groups.find((g) => norm(g.name).includes(norm(parsed.groupName)));
    }
    if (!group && groups.length === 1) [group] = groups;
    if (!group) {
        const list = groups.map((g) => `«${g.name}»`).join(', ');
        return {
            action: null,
            reply: uk
                ? `Будь ласка, уточніть, для якої групи: ${list}.`
                : `Please specify which group: ${list}.`,
        };
    }

    const p = parsed.event || {};

    // --- EDIT: locate the existing event ---
    let base;
    let editMeta = null;
    if (intent === 'edit') {
        const found = findEvent(group.weekData, parsed.targetEventName || p.name);
        if (!found) {
            return {
                action: null,
                reply: uk
                    ? `Не знайшов події «${parsed.targetEventName || p.name || ''}» у поточному розкладі групи «${group.name}». Уточніть назву, будь ласка.`
                    : `I couldn't find an event named "${parsed.targetEventName || p.name || ''}" in this week's schedule for "${group.name}". Please clarify the name.`,
            };
        }
        const ei = found.ev.eventInfo || {};
        const ed = found.ev.eventDate || {};
        base = {
            name: pick(p.name, ei.name),
            teacherName: pick(p.teacherName, ei.teacherName),
            type: pick(p.type, ei.type),
            // Preserve the event's stored colour; the model never supplies one, so
            // an edit must not let the client reset it to the type's default.
            color: pick(p.color, ei.color),
            place: pick(p.place, ei.place),
            platform: pick(p.platform, ei.platform),
            link: pick(p.link, ei.link),
            description: pick(p.description, ei.description),
            tag: p.tag != null ? mergeTags(ei.tag, p.tag) : ei.tag,
            duration: p.duration != null ? p.duration : ed.duration,
            day: pick(p.day, ed.day),
            date: p.date || null,
            time: pick(p.time, ed.time),
        };
        editMeta = {
            eventInfoId: String(ei._id),
            eventDateId: String(ed._id),
            isStatic: found.isStatic,
        };
    } else {
        base = { ...p };
    }

    // --- Resolve schedule type ---
    let scheduleType = parsed.scheduleType;
    if (intent === 'edit') scheduleType = editMeta.isStatic ? 'static' : 'dynamic';
    if (scheduleType !== 'static' && scheduleType !== 'dynamic') {
        scheduleType = base.date ? 'dynamic' : (base.day ? 'static' : 'dynamic');
    }

    // --- Required fields / missing ---
    const missing = [];
    if (!base.name) missing.push('name');
    if (!base.time) missing.push('time');
    if (scheduleType === 'static' && !base.day) missing.push('day');
    // A brand-new dynamic event needs an explicit date; editing an existing one
    // already has its day/week slot, so the date is optional there (otherwise a
    // simple "change the time" edit on a one-off event is wrongly rejected).
    if (scheduleType === 'dynamic' && !base.date && !(intent === 'edit' && base.day)) {
        missing.push('date');
    }

    if (missing.length) {
        const fields = missing.map((f) => labels[f]).join(uk ? ', ' : ', ');
        const verb = intent === 'edit' ? (uk ? 'відредагувати' : 'edit') : (uk ? 'створити' : 'create');
        return {
            action: null,
            reply: uk
                ? `Щоб ${verb} подію, вкажіть, будь ласка: ${fields}.`
                : `To ${verb} the event, please provide: ${fields}.`,
        };
    }

    if (base.duration == null) base.duration = DEFAULT_EVENT_DURATION;

    // --- Build the appliable action + confirmation text ---
    const when = whenText(scheduleType, base, lang);
    const verb = intent === 'edit'
        ? (uk ? 'Оновити' : 'Update')
        : (uk ? 'Створити' : 'Create');
    const reply = uk
        ? `${verb} подію «${base.name}» для групи «${group.name}» — ${when}, ${base.duration} хв. Підтвердити?`
        : `${verb} the event "${base.name}" for group "${group.name}" — ${when}, ${base.duration} min. Confirm?`;

    const action = {
        kind: intent, // 'create' | 'edit'
        scheduleType,
        groupId: String(group.id),
        groupName: group.name,
        event: base,
        ...(editMeta || {}),
    };

    return { action, reply };
};

// Resolve the model's extraction into a list of appliable actions. Accepts either
// the multi shape `{ actions: [entry…], reply }` or a single legacy entry.
// Each resolved action carries its own `summary` (confirmation text); entries that
// need clarification are collected into `notes` and folded into the overall reply.
const resolveMagicActions = (parsed, groups, lang) => {
    const uk = isLanguage(lang, 'uk');
    const entries = Array.isArray(parsed?.actions) && parsed.actions.length
        ? parsed.actions
        : [parsed || {}];

    const actions = [];
    const notes = [];
    for (const entry of entries) {
        const { action, reply } = resolveOne(entry, groups, lang);
        if (action) actions.push({ ...action, summary: reply });
        else if (reply) notes.push(reply);
    }

    let reply;
    if (actions.length) {
        const intro = uk
            ? (actions.length === 1
                ? 'Перевірте та підтвердьте дію нижче.'
                : `Підготував ${actions.length} дії. Підтвердьте кожну окремо нижче.`)
            : (actions.length === 1
                ? 'Please review and confirm the action below.'
                : `Prepared ${actions.length} actions. Confirm each one below.`);
        reply = notes.length ? `${intro}\n\n${notes.join('\n')}` : intro;
    } else {
        reply = notes.join('\n') || parsed?.reply || (uk
            ? 'Я можу створити або відредагувати подію. Опишіть, що зробити (через команду /magic).'
            : 'I can create or edit an event. Describe what to do (using the /magic command).');
    }

    return { actions, reply };
};

// Backwards-compatible single-action helper.
const resolveMagicAction = (parsed, groups, lang) => resolveOne(parsed, groups, lang);

module.exports = { resolveMagicAction, resolveMagicActions, resolveOne };
