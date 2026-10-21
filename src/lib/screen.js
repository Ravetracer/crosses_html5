// Small helpers that every scene uses: fading, the mouse pointer and retrace timing.

import Phaser from 'phaser';
import { FADE_DURATION, RETRACE_RATE } from '../constants.js';

const CameraEvents = Phaser.Cameras.Scene2D.Events;

// The original faded the palette from black. A camera fade looks the same.
export function fadeIn(scene) {
    return new Promise((resolve) => {
        scene.cameras.main.once(CameraEvents.FADE_IN_COMPLETE, resolve);
        scene.cameras.main.fadeIn(FADE_DURATION);
    });
}

export function fadeOut(scene) {
    return new Promise((resolve) => {
        scene.cameras.main.once(CameraEvents.FADE_OUT_COMPLETE, resolve);
        scene.cameras.main.fadeOut(FADE_DURATION);
    });
}

// Left mouse button or a tap on a touch screen
export function isPrimaryClick(pointer) {
    return pointer.leftButtonDown() || pointer.wasTouch;
}

// Resolves on the next left click anywhere on the screen.
export function waitForClick(scene) {
    return new Promise((resolve) => {
        const onPointerDown = (pointer) => {
            if (isPrimaryClick(pointer)) {
                scene.input.off('pointerdown', onPointerDown);
                resolve();
            }
        };
        scene.input.on('pointerdown', onPointerDown);
    });
}

// Draws the mouse pointer sprite of the game instead of the system cursor.
export function addMousePointer(scene) {
    const sprite = scene.add.image(0, 0, 'pointer').setOrigin(0, 0).setDepth(1000);
    sprite.setVisible(false);

    scene.input.on('pointermove', (pointer) => {
        sprite.setPosition(Math.floor(pointer.x), Math.floor(pointer.y));
        sprite.setVisible(!pointer.wasTouch);
    });
    scene.input.on('gameout', () => sprite.setVisible(false));

    // Show it right away if the mouse already is over the game
    const pointer = scene.input.activePointer;
    if (pointer.x > 0 || pointer.y > 0) {
        sprite.setPosition(Math.floor(pointer.x), Math.floor(pointer.y));
        sprite.setVisible(!pointer.wasTouch);
    }
    return sprite;
}

// Counts VGA retraces (70 per second), so effects run at the original speed
// no matter how fast the monitor refreshes.
export class RetraceClock {
    constructor() {
        this.elapsed = 0;
    }

    // Returns how many retraces happened during the last frame.
    advance(deltaMilliseconds) {
        const retraceDuration = 1000 / RETRACE_RATE;
        this.elapsed += deltaMilliseconds;

        let retraces = 0;
        while (this.elapsed >= retraceDuration) {
            this.elapsed -= retraceDuration;
            retraces++;
        }
        return retraces;
    }
}
