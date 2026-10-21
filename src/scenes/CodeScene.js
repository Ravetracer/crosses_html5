// Shows the password of the level that was just reached (showpassword in crosses.pas).

import Phaser from 'phaser';
import { TedText } from '../lib/fonts.js';
import { session } from '../lib/session.js';
import { addMousePointer, fadeIn, fadeOut, waitForClick } from '../lib/screen.js';

export class CodeScene extends Phaser.Scene {
    constructor() {
        super('Code');
    }

    async create() {
        const level = this.cache.json.get('levels')[session.level - 1];
        new TedText(this, 0, 0, 'pass', 'CODE:');
        new TedText(this, 0, 60, 'pass', level.password);
        addMousePointer(this);

        await fadeIn(this);
        await waitForClick(this);
        await fadeOut(this);
        this.scene.start('Game');
    }
}
