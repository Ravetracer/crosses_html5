// Name entry for a new hiscore (get_score in crosses.pas).

import Phaser from 'phaser';
import { TedText } from '../lib/fonts.js';
import { addHiscore, placeForScore } from '../lib/hiscores.js';
import { TextEntry } from '../lib/TextEntry.js';
import { session } from '../lib/session.js';
import { addMousePointer, fadeIn, fadeOut } from '../lib/screen.js';

const MAX_NAME_LENGTH = 20;
// The first three are from the original. The font has no digits, so the
// places are spelled out.
const PLACE_MESSAGES = [
    'YEAH. THE FIRST PLACE.',
    'GOOD. THE SECOND.',
    'SHIT. ONLY THE THIRD.',
    'NOT BAD. THE FOURTH.',
    'OK. THE FIFTH.',
    'THE SIXTH. HMM.',
    'THE SEVENTH. MEH.',
    'THE EIGHTH. OUCH.',
    'NINTH. TRY HARDER.',
    'PHEW. JUST THE TENTH.',
];

export class NameEntryScene extends Phaser.Scene {
    constructor() {
        super('NameEntry');
    }

    create() {
        const place = placeForScore(session.score);
        new TedText(this, 0, 0, 'score', PLACE_MESSAGES[place]);
        new TedText(this, 0, 20, 'score', 'ENTER YOUR NAME:');
        new TextEntry(this, {
            font: 'score',
            x: 0,
            y: 40,
            maxLength: MAX_NAME_LENGTH,
            allowSpace: true,
            onConfirm: (name) => this.saveName(name),
        });
        addMousePointer(this);
        fadeIn(this);
    }

    async saveName(name) {
        addHiscore(name, session.score);
        await fadeOut(this);
        this.scene.start('Menu');
    }
}
