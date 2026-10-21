// Main menu (procedure "mainmenu" in crosses.pas).
//
// The selected entry gets a frame that pulses from black to white, and a
// scroll text runs along the bottom of the screen.

import Phaser from 'phaser';
import { MENU_ENTRIES, SCREEN_HEIGHT, SCREEN_WIDTH } from '../constants.js';
import { TedText } from '../lib/fonts.js';
import { music } from '../lib/music.js';
import { RetraceClock, addMousePointer, fadeIn, fadeOut, isPrimaryClick } from '../lib/screen.js';

const SCROLL_TEXT =
    '  HELLO AND WELCOME TO \'CROSSES\'.' +
    ' WE HOPE THAT YOU LIKE THIS TINY THING.' +
    ' ALL GRAPHICS AND MUSICS ARE BY RAVETRACER. CODE BY' +
    ' RAVETRACER AND MYSTERIO OF CRYPTIC DEEP.' +
    ' THANX TO THE CREATORS OF MIDAS SOUND SYS. ';

const SCROLLER_Y = 175;
const SCROLL_SPEED = 3;            // pixels per retrace
const SCROLLER_GLYPH_WIDTH = 32;   // all glyphs of the scroller font are 31 pixels wide + 1 gap

// Grey levels (0..63) the frame of the selected entry runs through, one per retrace
const PULSE_LEVELS = [
    0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 63,
    60, 56, 52, 48, 44, 40, 36, 32, 28, 24, 20, 16, 12, 8, 4,
];

export class MenuScene extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    create() {
        this.clock = new RetraceClock();
        this.busy = false;
        this.selected = 0;
        this.pulseStep = 0;

        this.add.image(0, 0, 'menu').setOrigin(0, 0);
        this.boxes = MENU_ENTRIES.map((entry, index) =>
            this.add.image(0, 0, `menu-box-${index + 1}`).setOrigin(0, 0).setVisible(false));
        this.createScroller();
        this.createEntryZones();
        addMousePointer(this);

        music.play('main');
        fadeIn(this);
    }

    createEntryZones() {
        MENU_ENTRIES.forEach((entry, index) => {
            const zone = this.add.zone(entry.x, entry.y, entry.width, entry.height).setOrigin(0, 0);
            zone.setInteractive();
            zone.on('pointerover', () => this.select(index));
            zone.on('pointerdown', (pointer) => {
                if (isPrimaryClick(pointer)) {
                    this.activate(index);
                }
            });
        });
    }

    // The scroller covers the bottom 25 lines with black, like the TED scroll bitmap did
    createScroller() {
        this.add.rectangle(0, SCROLLER_Y, SCREEN_WIDTH, SCREEN_HEIGHT - SCROLLER_Y, 0x000000).setOrigin(0, 0);

        this.scrollGlyphs = [];
        let offset = 0;
        for (const char of SCROLL_TEXT) {
            const glyph = new TedText(this, 0, SCROLLER_Y, 'crosses', char);
            this.scrollGlyphs.push({ glyph, offset });
            offset += SCROLLER_GLYPH_WIDTH;
        }
        this.scrollLength = offset;
        this.scrollPosition = 0;
        this.updateScroller();
    }

    updateScroller() {
        for (const { glyph, offset } of this.scrollGlyphs) {
            // The text enters at the right edge and repeats endlessly
            let x = SCREEN_WIDTH + offset - this.scrollPosition;
            while (x < -SCROLLER_GLYPH_WIDTH) {
                x += this.scrollLength;
            }
            glyph.setX(x);
            glyph.setVisible(x < SCREEN_WIDTH);
        }
    }

    update(time, delta) {
        const retraces = this.clock.advance(delta);
        if (retraces === 0) {
            return;
        }
        this.scrollPosition += retraces * SCROLL_SPEED;
        this.updateScroller();

        this.pulseStep = (this.pulseStep + retraces) % PULSE_LEVELS.length;
        this.updateSelectedBox();
    }

    updateSelectedBox() {
        const grey = Math.round((PULSE_LEVELS[this.pulseStep] * 255) / 63);
        this.boxes.forEach((box, index) => {
            box.setVisible(index === this.selected);
            box.setTint(Phaser.Display.Color.GetColor(grey, grey, grey));
        });
    }

    select(index) {
        if (!this.busy) {
            this.selected = index;
        }
    }

    async activate(index) {
        if (this.busy) {
            return;
        }
        this.busy = true;
        this.selected = index;

        music.stop();
        await fadeOut(this);

        const action = MENU_ENTRIES[index].action;
        if (action === 'start') {
            this.scene.start('Password');
        } else if (action === 'hiscore') {
            this.scene.start('Hiscore');
        } else {
            // "Exit game" went back to DOS. In the browser we return to the title picture.
            this.scene.start('Title');
        }
    }
}
