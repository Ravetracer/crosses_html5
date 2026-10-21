// Title picture (procedure "titel" in crosses.pas).
//
// The picture unfolds from the middle line, a blinking text asks for a click,
// then the picture folds back into the middle line.

import Phaser from 'phaser';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../constants.js';
import { SmallText, rgbToColor } from '../lib/fonts.js';
import { music } from '../lib/music.js';
import { RetraceClock, addMousePointer } from '../lib/screen.js';

const MIDDLE_LINE = SCREEN_HEIGHT / 2;
const PROMPT_TEXT = 'PRESS MOUSE BUTTON TO GO ON';
const PROMPT_Y = 180;

export class TitleScene extends Phaser.Scene {
    constructor() {
        super('Title');
    }

    create() {
        this.clock = new RetraceClock();
        this.createCanvas();

        this.promptColors = this.cache.json.get('palettes').titleText.map(rgbToColor);
        const promptX = Math.floor((SCREEN_WIDTH - PROMPT_TEXT.length * 8) / 2);
        this.prompt = new SmallText(this, promptX, PROMPT_Y, PROMPT_TEXT).setVisible(false);
        this.promptStep = 0;

        addMousePointer(this);

        // The unfold effect runs from the middle line (100) up to the top line (0)
        this.phase = 'opening';
        this.foldLine = MIDDLE_LINE;
        this.drawFolded(this.foldLine);

        this.input.on('pointerdown', () => this.handleClick());
    }

    createCanvas() {
        if (this.textures.exists('title-screen')) {
            this.textures.remove('title-screen');
        }
        this.screen = this.textures.createCanvas('title-screen', SCREEN_WIDTH, SCREEN_HEIGHT);
        this.add.image(0, 0, 'title-screen').setOrigin(0, 0);

        // Copy of the picture we can draw into for the closing effect
        this.picture = document.createElement('canvas');
        this.picture.width = SCREEN_WIDTH;
        this.picture.height = SCREEN_HEIGHT;
        this.picture.getContext('2d').drawImage(this.textures.get('titel').getSourceImage(), 0, 0);
    }

    // Shows the picture with the top `line` rows replaced by picture row `line` and
    // the bottom `line` rows by picture row (200 - line). This is what the two
    // nested loops with move() in the original produced on screen.
    drawFolded(line) {
        const context = this.screen.getContext();
        context.imageSmoothingEnabled = false;
        context.fillStyle = '#000';
        context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        context.drawImage(this.picture, 0, 0);

        if (line > 0) {
            const bottomLine = SCREEN_HEIGHT - line;
            context.drawImage(this.picture, 0, line, SCREEN_WIDTH, 1, 0, 1, SCREEN_WIDTH, line);
            context.drawImage(this.picture, 0, bottomLine, SCREEN_WIDTH, 1, 0, bottomLine, SCREEN_WIDTH, line);
        }
        // The original never wrote the first line
        context.fillRect(0, 0, SCREEN_WIDTH, 1);
        this.screen.refresh();
    }

    update(time, delta) {
        const retraces = this.clock.advance(delta);
        for (let i = 0; i < retraces; i++) {
            this.step();
        }
    }

    // One retrace of the effect that is currently running
    step() {
        if (this.phase === 'opening') {
            this.foldLine--;
            this.drawFolded(this.foldLine);
            if (this.foldLine === 0) {
                this.phase = 'waiting';
                this.prompt.setVisible(true);
            }
        } else if (this.phase === 'waiting') {
            this.stepPrompt();
        } else if (this.phase === 'closing') {
            this.foldLine++;
            this.drawFolded(this.foldLine);
            if (this.foldLine === MIDDLE_LINE) {
                this.phase = 'done';
                this.scene.start('Menu');
            }
        }
    }

    // The text fades in through the palette colours and back out again
    stepPrompt() {
        const colorCount = this.promptColors.length;
        const position = this.promptStep % (2 * colorCount - 2);
        const colorIndex = position < colorCount ? position : 2 * colorCount - 2 - position;
        this.prompt.setColor(this.promptColors[colorIndex]);
        this.promptStep++;
    }

    handleClick() {
        // The first click also allows the browser to play sound
        music.unlock();

        if (this.phase !== 'waiting') {
            return;
        }
        this.prompt.setVisible(false);

        // Before folding, the original blanked the two middle lines of the picture
        const context = this.picture.getContext('2d');
        context.fillStyle = '#000';
        context.fillRect(0, MIDDLE_LINE, SCREEN_WIDTH, 2);

        this.phase = 'closing';
        this.foldLine = 0;
    }
}
