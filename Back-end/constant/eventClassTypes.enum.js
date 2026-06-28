const CLASS_TYPE_NAMES = [
    'Lecture', 'Lesson', 'Seminar', 'Webinar', 'Workshop', 'Laboratory',
    'Лекція', 'Урок', 'Заняття', 'Семінар', 'Вебінар',
    'Практика', 'Практичне', 'Практичне заняття',
    'Лабораторна', 'Лабораторна робота', 'Пара',
];

const CLASS_TYPE_SET = new Set(CLASS_TYPE_NAMES.map((t) => t.trim().toLowerCase()));

// True when a type string denotes an attendance-required class ("пара").
// Empty/unknown types are NOT classes here — callers decide how to treat those.
const isClassType = (type) => CLASS_TYPE_SET.has(String(type || '').trim().toLowerCase());

// Ukrainian-readable subset (lowercased) for human-facing copy, e.g. the hidden
// assistant rules. Derived from the same list so wording never drifts.
const CLASS_TYPE_LABELS_UA = CLASS_TYPE_NAMES
    .filter((t) => /[а-яіїєґ]/i.test(t))
    .map((t) => t.toLowerCase());

module.exports = {
    CLASS_TYPE_NAMES,
    CLASS_TYPE_SET,
    isClassType,
    CLASS_TYPE_LABELS_UA,
};
