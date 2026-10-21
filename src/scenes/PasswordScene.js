// Password entry before a game starts (get_password in crosses.pas).
// A known password starts at its level, anything else at level 1.

import Phaser from 'phaser';
import { CHEAT_PASSWORD, LAST_PASSWORD_LEVEL } from '../constants.js';
import { TedText } from '../lib/fonts.js';
import { TextEntry } from '../lib/TextEntry.js';
import { session } from '../lib/session.js';
import { addMousePointer, fadeIn, fadeOut, waitForClick } from '../lib/screen.js';

const MAX_PASSWORD_LENGTH = 8;

export class PasswordScene extends Phaser.Scene {
    constructor() {
        super('Password');
    }

    create() {
        new TedText(this, 0, 0, 'pass', 'PASSWORD:');
        new TextEntry(this, {
            font: 'pass',
            x: 0,
            y: 50,
            maxLength: MAX_PASSWORD_LENGTH,
            allowSpace: false,
            onConfirm: (password) => this.startGame(password),
        });
        addMousePointer(this);
        fadeIn(this);
    }

    async startGame(password) {
        if (password === CHEAT_PASSWORD) {
            session.cheater = true;
        }
        if (session.cheater) {
            new TedText(this, 0, 100, 'pass', 'CHEATER');
            await waitForClick(this);
        }

        session.startNewGame(this.findLevel(password));
        await fadeOut(this);
        this.scene.start('Game');
    }

    // Returns the 1 based level number for a password
    findLevel(password) {
        const levels = this.cache.json.get('levels');
        for (let number = 1; number <= LAST_PASSWORD_LEVEL; number++) {
            if (levels[number - 1].password === password) {
                return number;
            }
        }
        return 1;
    }
}
