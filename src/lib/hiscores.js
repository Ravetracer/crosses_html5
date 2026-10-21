// The ten best scores. The original stored three of them in hiscore.crs, here they
// live in the localStorage of the browser.

const STORAGE_KEY = 'crosses.hiscores';
export const HISCORE_COUNT = 10;

// Easy to beat, so a first game already gets onto the list
const DEFAULT_HISCORES = [
    { name: 'PIXEL PUSHER', score: 100 },
    { name: 'MOD MASTER', score: 90 },
    { name: 'VGA VIKING', score: 80 },
    { name: 'RETRO RITA', score: 70 },
    { name: 'TRACKER TOM', score: 60 },
    { name: 'DOS DUDE', score: 50 },
    { name: 'SOUND BLASTER', score: 40 },
    { name: 'BIT BUSTER', score: 30 },
    { name: 'CODE KID', score: 20 },
    { name: 'NONAME', score: 10 },
];

let entries = [];

export function initHiscores() {
    const stored = loadStoredEntries();
    const storedIsValid = Array.isArray(stored) && stored.length === HISCORE_COUNT;
    entries = storedIsValid ? stored : DEFAULT_HISCORES.map((entry) => ({ ...entry }));
    sortByScore();
}

export function getHiscores() {
    return entries;
}

// Returns the place (0 = first) a score would get, or -1 if it is too low.
export function placeForScore(score) {
    return entries.findIndex((entry) => score > entry.score);
}

export function addHiscore(name, score) {
    entries.push({ name, score });
    sortByScore();
    entries = entries.slice(0, HISCORE_COUNT);
    saveEntries();
}

function sortByScore() {
    entries.sort((first, second) => second.score - first.score);
}

function loadStoredEntries() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        // Storage may be blocked (private mode etc.), the defaults will do then
        return null;
    }
}

function saveEntries() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
        // Not being able to save the hiscore must not break the game
    }
}
