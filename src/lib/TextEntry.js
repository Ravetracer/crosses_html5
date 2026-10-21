// Text input for the password and the hiscore name.
//
// The original read the keyboard with readkey. To play with the mouse only, this
// adds an on-screen keyboard; typing on a real keyboard works as well.

import { SCREEN_WIDTH } from '../constants.js';
import { TedText } from './fonts.js';
import { isPrimaryClick } from './screen.js';

const KEY_FONT = 'score';
const KEY_CELL_SIZE = 18;
const KEYS_PER_ROW = 13;
const LETTER_ROWS = ['ABCDEFGHIJKLM', 'NOPQRSTUVWXYZ'];
const FIRST_ROW_Y = 104;
const BUTTON_ROW_Y = 150;
const BUTTON_GAP = 16;
const BUTTON_PADDING = 3;
const HOVER_COLOR = 0x3cb4b4;

export class TextEntry {
    /**
     * @param {import('phaser').Scene} scene
     * @param {object} options
     * @param {string} options.font       TED font for the entered text
     * @param {number} options.x          position of the entered text
     * @param {number} options.y
     * @param {number} options.maxLength
     * @param {boolean} options.allowSpace
     * @param {(text: string) => void} options.onConfirm
     */
    constructor(scene, { font, x, y, maxLength, allowSpace, onConfirm }) {
        this.scene = scene;
        this.maxLength = maxLength;
        this.allowSpace = allowSpace;
        this.onConfirm = onConfirm;
        this.text = '';
        this.enabled = true;

        this.display = new TedText(scene, x, y, font);
        this.hoverFrame = scene.add.graphics();

        this.createLetterKeys();
        this.createButtons();

        // A plain DOM listener: Phaser's queued keyboard events can repeat keys
        // that are typed very quickly.
        this.handleKeyDown = this.handleKeyDown.bind(this);
        window.addEventListener('keydown', this.handleKeyDown);
        scene.events.once('shutdown', () => window.removeEventListener('keydown', this.handleKeyDown));
    }

    createLetterKeys() {
        const rowWidth = KEYS_PER_ROW * KEY_CELL_SIZE;
        const left = Math.floor((SCREEN_WIDTH - rowWidth) / 2);

        LETTER_ROWS.forEach((letters, rowIndex) => {
            const y = FIRST_ROW_Y + rowIndex * KEY_CELL_SIZE;
            [...letters].forEach((letter, column) => {
                const x = left + column * KEY_CELL_SIZE;
                this.createKey(x, y, KEY_CELL_SIZE, letter, () => this.addChar(letter));
            });
        });
    }

    createButtons() {
        const buttons = [];
        if (this.allowSpace) {
            buttons.push({ label: 'SPACE', action: () => this.addChar(' ') });
        }
        buttons.push({ label: 'DEL', action: () => this.deleteChar() });
        buttons.push({ label: 'OK', action: () => this.confirm() });

        // Measure the labels first, so the row can be centered
        for (const button of buttons) {
            const label = new TedText(this.scene, 0, 0, KEY_FONT, button.label);
            button.width = label.textWidth + 2 * BUTTON_PADDING;
            label.destroy();
        }
        const rowWidth = buttons.reduce((sum, button) => sum + button.width, 0) + BUTTON_GAP * (buttons.length - 1);

        let x = Math.floor((SCREEN_WIDTH - rowWidth) / 2);
        for (const button of buttons) {
            this.createKey(x, BUTTON_ROW_Y, button.width, button.label, button.action);
            x += button.width + BUTTON_GAP;
        }
    }

    // A clickable area with a label centered inside it.
    createKey(x, y, width, label, action) {
        const height = KEY_CELL_SIZE;
        const text = new TedText(this.scene, 0, 0, KEY_FONT, label);
        text.setPosition(x + Math.floor((width - text.textWidth) / 2) + 1, y + 3);

        const zone = this.scene.add.zone(x, y, width, height).setOrigin(0, 0).setInteractive();
        zone.on('pointerover', () => this.showHoverFrame(x, y, width, height));
        zone.on('pointerout', () => this.hoverFrame.clear());
        zone.on('pointerdown', (pointer) => {
            if (this.enabled && isPrimaryClick(pointer)) {
                action();
            }
        });
    }

    showHoverFrame(x, y, width, height) {
        this.hoverFrame.clear();
        this.hoverFrame.lineStyle(1, HOVER_COLOR);
        this.hoverFrame.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
    }

    handleKeyDown(event) {
        if (!this.enabled) {
            return;
        }
        if (event.key === 'Enter') {
            this.confirm();
        } else if (event.key === 'Backspace') {
            this.deleteChar();
        } else if (event.key === ' ' && this.allowSpace) {
            this.addChar(' ');
        } else if (/^[a-zA-Z]$/.test(event.key)) {
            this.addChar(event.key.toUpperCase());
        }
    }

    addChar(char) {
        if (this.text.length < this.maxLength) {
            this.text += char;
            this.display.setText(this.text);
        }
    }

    deleteChar() {
        this.text = this.text.slice(0, -1);
        this.display.setText(this.text);
    }

    confirm() {
        this.enabled = false;
        this.hoverFrame.clear();
        window.removeEventListener('keydown', this.handleKeyDown);
        this.onConfirm(this.text);
    }
}
