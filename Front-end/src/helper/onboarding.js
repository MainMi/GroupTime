import { STORAGE_KEYS } from '../constants/storageKeys';
import { getStorageJSON, setStorageJSON, removeStorage } from './storageHelper';

export const TOUR_SECTIONS = {
    NAVIGATION: 'navigation',
    SCHEDULE: 'schedule',
    GROUP: 'group',
};

const ALL_SECTIONS = Object.values(TOUR_SECTIONS);

const read = () => getStorageJSON(STORAGE_KEYS.TOUR_DONE, {});

const write = (state) => setStorageJSON(STORAGE_KEYS.TOUR_DONE, state);

export const isTourDone = (section) => !!read()[section];

export const areAllToursDone = () => {
    const state = read();
    return ALL_SECTIONS.every((s) => state[s]);
};

export const markTourDone = (section) => {
    const state = read();
    state[section] = true;
    write(state);
};

export const markAllToursDone = () => {
    const state = read();
    ALL_SECTIONS.forEach((s) => { state[s] = true; });
    write(state);
};

export const resetTours = () => removeStorage(STORAGE_KEYS.TOUR_DONE);

let serverSynced = false;
export const syncTourComplete = (completeTourFn, navigate) => {
    if (serverSynced) return;
    serverSynced = true;
    try {
        completeTourFn(navigate);
    } catch (e) {
        serverSynced = false;
        console.error('Failed to sync tour completion:', e);
    }
};

// The "?" help button restarts only the highest-priority mounted tour, so page
// tours win over the global navigation tour and overlays never stack.
let responders = [];

export const registerTourResponder = (fn, priority = 0) => {
    const entry = { fn, priority };
    responders.push(entry);
    return () => {
        responders = responders.filter((r) => r !== entry);
    };
};

export const restartTours = () => {
    if (!responders.length) return;
    const best = responders.reduce((a, b) => (b.priority >= a.priority ? b : a));
    best.fn();
};
