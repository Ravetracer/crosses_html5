// Loads all assets and prepares texture frames, then starts the title screen.

import Phaser from 'phaser';
import { MUSIC_TRACKS, TILE_SIZE } from '../constants.js';
import { loadFonts, registerFontFrames } from '../lib/fonts.js';
import { initHiscores } from '../lib/hiscores.js';
import { music } from '../lib/music.js';

const SCREEN_IMAGES = ['titel', 'menu', 'field', 'gameover', 'solved', 'hiscore'];

// Parts of field.pcx that the game copied to the screen (copy_area in crosses.pas)
const FIELD_FRAMES = {
    board: { x: 5, y: 5, width: 188, height: 189 },
    panel: { x: 198, y: 5, width: 122, height: 121 },
    pause: { x: 204, y: 145, width: 62, height: 11 },
};

// Digits 0..9 in field.pcx (the "nums" table): x, y, width. All are 14 pixels high.
const DIGITS = [
    [298, 148, 13], [213, 130, 4], [218, 130, 12], [231, 130, 11], [243, 130, 14],
    [258, 130, 12], [272, 130, 12], [285, 130, 12], [297, 130, 13], [283, 148, 12],
];
const DIGIT_HEIGHT = 14;

export class BootScene extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        for (const name of SCREEN_IMAGES) {
            this.load.image(name, `assets/images/${name}.png`);
        }
        for (let box = 1; box <= 3; box++) {
            this.load.image(`menu-box-${box}`, `assets/images/menu-box-${box}.png`);
        }
        this.load.spritesheet('tiles', 'assets/images/tiles.png', {
            frameWidth: TILE_SIZE,
            frameHeight: TILE_SIZE,
        });
        this.load.image('pointer', 'assets/images/pointer.png');
        loadFonts(this.load);

        this.load.json('levels', 'assets/data/levels.json');
        this.load.json('palettes', 'assets/data/palettes.json');

        for (const track of MUSIC_TRACKS) {
            this.load.binary(`music-${track}`, `assets/music/${track}.s3m`);
        }
    }

    create() {
        this.addFieldFrames();
        registerFontFrames(this.textures, this.cache);
        initHiscores();

        for (const track of MUSIC_TRACKS) {
            music.addTrack(track, this.cache.binary.get(`music-${track}`));
        }

        this.scene.start('Title');
    }

    addFieldFrames() {
        const field = this.textures.get('field');
        for (const [name, area] of Object.entries(FIELD_FRAMES)) {
            field.add(name, 0, area.x, area.y, area.width, area.height);
        }
        DIGITS.forEach(([x, y, width], digit) => {
            field.add(`digit-${digit}`, 0, x, y, width, DIGIT_HEIGHT);
        });
    }
}
