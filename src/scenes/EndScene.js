// "Game over" or "Congratulation" picture with its own music.

import Phaser from 'phaser';
import { placeForScore } from '../lib/hiscores.js';
import { music } from '../lib/music.js';
import { session } from '../lib/session.js';
import { addMousePointer, fadeIn, fadeOut, waitForClick } from '../lib/screen.js';

export class EndScene extends Phaser.Scene {
    constructor() {
        super('End');
    }

    init({ solved }) {
        this.screenName = solved ? 'solved' : 'gameover';
    }

    async create() {
        this.add.image(0, 0, this.screenName).setOrigin(0, 0);
        addMousePointer(this);

        await fadeIn(this);
        music.play(this.screenName);
        await waitForClick(this);
        await fadeOut(this);

        // The music keeps playing while the player enters a name
        if (placeForScore(session.score) >= 0) {
            this.scene.start('NameEntry');
        } else {
            this.scene.start('Menu');
        }
    }
}
