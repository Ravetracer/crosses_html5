// Player settings: how big the game is drawn, whether the upscaled pixels are
// smoothed, whether a CRT monitor is simulated and whether music plays.
// The game always renders at 320x200, the browser scales the canvas.

import Phaser from 'phaser';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from './constants.js';
import { CrtOverlay } from './lib/CrtOverlay.js';
import { music } from './lib/music.js';

const STORAGE_KEY = 'crosses.settings';

export const SIZE_OPTIONS = [
    { value: 'fit', label: 'Fit window' },
    { value: 'whole', label: 'Fit window (whole pixels)' },
    { value: '1', label: '1x (320x200)' },
    { value: '2', label: '2x (640x400)' },
    { value: '3', label: '3x (960x600)' },
    { value: '4', label: '4x (1280x800)' },
];

const DEFAULT_SETTINGS = { size: 'fit', smoothing: false, crt: false, music: true };

export function loadSettings() {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return { ...DEFAULT_SETTINGS, ...stored };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

function saveSettings(settings) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // Settings just won't be remembered
    }
}

function applySettings(game, crt, settings) {
    music.setEnabled(settings.music);
    game.canvas.style.imageRendering = settings.smoothing ? 'auto' : 'pixelated';
    crt.setSmoothing(settings.smoothing);
    crt.setEnabled(settings.crt);

    if (settings.size === 'fit') {
        game.scale.scaleMode = Phaser.Scale.FIT;
        game.scale.refresh();
    } else {
        game.scale.scaleMode = Phaser.Scale.NONE;
        game.scale.setZoom(zoomFor(settings.size));
    }
}

function zoomFor(size) {
    if (size === 'whole') {
        return largestWholeZoom();
    }
    return Number(size);
}

// The biggest whole multiple of 320x200 that still fits into the window
function largestWholeZoom() {
    const horizontal = Math.floor(window.innerWidth / SCREEN_WIDTH);
    const vertical = Math.floor(window.innerHeight / SCREEN_HEIGHT);
    return Math.max(1, Math.min(horizontal, vertical));
}

// Builds the small settings panel behind the button in the top right corner (see index.html).
export function initSettingsPanel(game) {
    const settings = loadSettings();
    const sizeSelect = document.getElementById('setting-size');
    const smoothingCheckbox = document.getElementById('setting-smoothing');
    const crtCheckbox = document.getElementById('setting-crt');
    const musicCheckbox = document.getElementById('setting-music');
    const toggleButton = document.getElementById('settings-toggle');
    const panel = document.getElementById('settings-panel');

    for (const option of SIZE_OPTIONS) {
        sizeSelect.add(new Option(option.label, option.value));
    }
    sizeSelect.value = settings.size;
    smoothingCheckbox.checked = settings.smoothing;
    crtCheckbox.checked = settings.crt;
    musicCheckbox.checked = settings.music;

    const crt = new CrtOverlay(game);
    crtCheckbox.disabled = !crt.isAvailable();

    const update = (event) => {
        // Give the keyboard back to the game, otherwise Enter or Space would
        // keep operating the settings control
        event.target.blur();

        settings.size = sizeSelect.value;
        settings.smoothing = smoothingCheckbox.checked;
        settings.crt = crtCheckbox.checked;
        settings.music = musicCheckbox.checked;
        saveSettings(settings);
        applySettings(game, crt, settings);
    };
    sizeSelect.addEventListener('change', update);
    smoothingCheckbox.addEventListener('change', update);
    crtCheckbox.addEventListener('change', update);
    musicCheckbox.addEventListener('change', update);

    toggleButton.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        toggleButton.blur();
    });

    // "Whole pixels" depends on the window size
    window.addEventListener('resize', () => {
        if (settings.size === 'whole') {
            applySettings(game, crt, settings);
        }
    });

    applySettings(game, crt, settings);
}
