// Hiscore table (procedure "hiscore" in crosses.pas).
// The entries cycle through a range of palette colours, each line a bit ahead.

import Phaser from 'phaser';
import { SmallText, rgbToColor } from '../lib/fonts.js';
import { getHiscores } from '../lib/hiscores.js';
import { music } from '../lib/music.js';
import { RetraceClock, addMousePointer, fadeIn, fadeOut, waitForClick } from '../lib/screen.js';

// The original showed three lines 20 pixels apart. Ten lines need to sit closer
// together to fit below the logo, which ends at line 89.
const NAME_X = 40;
const SCORE_RIGHT_EDGE = 290;      // scores are right aligned
const FIRST_LINE_Y = 96;
const LINE_HEIGHT = 10;
const COLOR_OFFSET_PER_LINE = 3;
const GLYPH_WIDTH = 8;

export class HiscoreScene extends Phaser.Scene {
    constructor() {
        super('Hiscore');
    }

    async create() {
        this.clock = new RetraceClock();
        this.colors = this.cache.json.get('palettes').hiscoreText.map(rgbToColor);
        this.colorStep = 0;

        this.add.image(0, 0, 'hiscore').setOrigin(0, 0);
        this.lines = getHiscores().map((entry, index) => {
            const y = FIRST_LINE_Y + index * LINE_HEIGHT;
            const rank = String(index + 1).padStart(2, ' ');
            const score = String(entry.score);
            const scoreX = SCORE_RIGHT_EDGE - score.length * GLYPH_WIDTH;
            return [
                new SmallText(this, NAME_X, y, `${rank}. ${entry.name}`),
                new SmallText(this, scoreX, y, score),
            ];
        });
        this.updateColors();
        addMousePointer(this);

        await fadeIn(this);
        music.play('hiscore');
        await waitForClick(this);
        music.stop();
        await fadeOut(this);
        this.scene.start('Menu');
    }

    update(time, delta) {
        const retraces = this.clock.advance(delta);
        if (retraces > 0) {
            this.colorStep += retraces;
            this.updateColors();
        }
    }

    updateColors() {
        this.lines.forEach((texts, index) => {
            const colorIndex = (this.colorStep + index * COLOR_OFFSET_PER_LINE) % this.colors.length;
            for (const text of texts) {
                text.setColor(this.colors[colorIndex]);
            }
        });
    }
}
