// Filtering + localStorage presets for the schedule page.

import { STORAGE_KEYS } from '../constants/storageKeys';
import { getStorageJSON, setStorageJSON } from './storageHelper';

export const EMPTY_FILTER = {
    types: [],
    tags: [],
    teachers: [],
    places: [],
    kinds: [],
    groups: [],
};

// label holds an i18n key, resolved by the ScheduleFilter UI at render time.
export const KIND_OPTIONS = [
    { value: 'static', label: 'event.static' },
    { value: 'dynamic', label: 'event.dynamic' },
];

// Tags may be a legacy string or the new array — normalise to an array.
export const normalizeTags = (tag) =>
    Array.isArray(tag) ? tag.filter(Boolean) : (tag ? [tag] : []);

export const isEmptyFilter = (filter) =>
    !filter ||
    (!filter.types?.length &&
        !filter.tags?.length &&
        !filter.teachers?.length &&
        !filter.places?.length &&
        !filter.kinds?.length &&
        !filter.groups?.length);

// Collect the distinct values available across one or many loaded weeks so the
// filter UI offers options that actually exist (accepts a single scheduleWeek
// or an array of them — used to span all of the user's groups).
export const extractFilterOptions = (scheduleWeeks) => {
    const list = Array.isArray(scheduleWeeks) ? scheduleWeeks : [scheduleWeeks];
    const types = new Set();
    const tags = new Set();
    const teachers = new Set();
    const places = new Set();

    list.forEach((sw) => {
        const data = sw?.data || {};
        ['staticWeek', 'dynamicWeek'].forEach((key) => {
            const days = Array.isArray(data[key]) ? data[key] : [];
            days.forEach((day) => {
                (day.events || []).forEach((ev) => {
                    const info = ev.eventInfo || {};
                    if (info.type) types.add(info.type);
                    normalizeTags(info.tag).forEach((t) => tags.add(t));
                    if (info.teacherName) teachers.add(info.teacherName);
                    if (info.place) places.add(info.place);
                    if (info.platform) places.add(info.platform);
                });
            });
        });
    });

    return {
        types: [...types].sort(),
        tags: [...tags].sort(),
        teachers: [...teachers].sort(),
        places: [...places].sort(),
        kinds: KIND_OPTIONS,
    };
};

// An empty array on a dimension means "no constraint" on that dimension.
export const eventMatchesFilter = (event, isStatic, filter) => {
    if (isEmptyFilter(filter)) return true;
    const info = event?.eventInfo || {};

    if (filter.types?.length && !filter.types.includes(info.type)) return false;
    if (filter.tags?.length) {
        const evTags = normalizeTags(info.tag);
        if (!filter.tags.some((t) => evTags.includes(t))) return false;
    }
    if (filter.teachers?.length && !filter.teachers.includes(info.teacherName)) return false;
    if (
        filter.places?.length &&
        !filter.places.includes(info.place) &&
        !filter.places.includes(info.platform)
    ) {
        return false;
    }
    if (filter.kinds?.length && !filter.kinds.includes(isStatic ? 'static' : 'dynamic')) return false;

    return true;
};

export const loadPresets = () => {
    const parsed = getStorageJSON(STORAGE_KEYS.FILTER_PRESETS, []);
    return Array.isArray(parsed) ? parsed : [];
};

export const savePresets = (presets) => setStorageJSON(STORAGE_KEYS.FILTER_PRESETS, presets);
