// The game itself (procedure "ablauf" in crosses.pas).
//
// Mouse controls:
//   left click on a tile      set a cross (flips the tile and its four neighbours)
//   right click               pause, any click continues
//   click on the logo         give up (was ESC in the original, which still works too)

import Phaser from 'phaser';
import {
    BOARD_LEFT,
    BOARD_SIZE,
    BOARD_TOP,
    GIVE_UP_AREA,
    LEVEL_COUNT,
    LEVEL_NUMBER_POSITION,
    PASSWORD_LEVEL_STEP,
    PAUSE_LABEL_POSITION,
    SCORE_NUMBER_POSITION,
    SCORE_PER_SECOND,
    SCORE_PER_SECOND_CHEATER,
    TILE_OFF_FRAME,
    TILE_SIZE,
    TILE_SPACING,
    TIME_NUMBER_POSITION,
} from '../constants.js';
import { Board } from '../lib/Board.js';
import { PanelNumber } from '../lib/PanelNumber.js';
import { music } from '../lib/music.js';
import { session } from '../lib/session.js';
import { addMousePointer, fadeIn, fadeOut, isPrimaryClick } from '../lib/screen.js';

const ONE_SECOND = 1000;

export class GameScene extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    create() {
        this.levels = this.cache.json.get('levels');
        this.inputLocked = true;
        this.paused = false;

        // The playing field and the side panel were copied out of field.pcx
        this.add.image(7, 7, 'field', 'board').setOrigin(0, 0);
        this.add.image(195, 5, 'field', 'panel').setOrigin(0, 0);
        this.pauseLabel = this.add.image(PAUSE_LABEL_POSITION.x, PAUSE_LABEL_POSITION.y, 'field', 'pause')
            .setOrigin(0, 0)
            .setVisible(false);

        this.levelNumber = new PanelNumber(this, LEVEL_NUMBER_POSITION);
        this.scoreNumber = new PanelNumber(this, SCORE_NUMBER_POSITION);
        this.timeNumber = new PanelNumber(this, TIME_NUMBER_POSITION);
        this.createTiles();

        addMousePointer(this);
        this.input.on('pointerdown', (pointer) => this.handleClick(pointer));
        this.input.keyboard.on('keydown-ESC', () => this.giveUp());

        music.play('ingame');
        this.startLevel();
    }

    createTiles() {
        this.tiles = [];
        for (let y = 0; y < BOARD_SIZE; y++) {
            const row = [];
            for (let x = 0; x < BOARD_SIZE; x++) {
                const screenX = BOARD_LEFT + x * TILE_SPACING;
                const screenY = BOARD_TOP + y * TILE_SPACING;
                row.push(this.add.image(screenX, screenY, 'tiles', TILE_OFF_FRAME).setOrigin(0, 0));
            }
            this.tiles.push(row);
        }
    }

    startLevel() {
        const level = this.levels[session.level - 1];
        this.board = new Board(level.board);
        this.tileFrame = level.tile - 1;
        this.timeLeft = level.time;

        this.drawBoard();
        this.levelNumber.setValue(session.level);
        this.scoreNumber.setValue(session.score);
        this.timeNumber.setValue(this.timeLeft);

        // Restart the clock, so the first second of a level is a full one
        if (this.clock) {
            this.clock.remove();
        }
        this.clock = this.time.addEvent({ delay: ONE_SECOND, loop: true, callback: () => this.onSecondPassed() });

        this.inputLocked = false;
        fadeIn(this);
    }

    drawBoard() {
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                const frame = this.board.isSet(x, y) ? this.tileFrame : TILE_OFF_FRAME;
                this.tiles[y][x].setFrame(frame);
            }
        }
    }

    onSecondPassed() {
        if (this.inputLocked || this.paused || session.cheater) {
            return;
        }
        this.timeLeft--;
        if (this.timeLeft < 0) {
            this.gameOver();
            return;
        }
        this.timeNumber.setValue(this.timeLeft);
    }

    handleClick(pointer) {
        if (this.inputLocked) {
            return;
        }
        if (this.paused) {
            this.setPaused(false);
            return;
        }
        if (pointer.rightButtonDown()) {
            this.setPaused(true);
            return;
        }
        if (!isPrimaryClick(pointer)) {
            return;
        }

        const cell = this.cellAt(pointer.x, pointer.y);
        if (cell) {
            this.setCross(cell.x, cell.y);
        } else if (Phaser.Geom.Rectangle.Contains(this.giveUpArea(), pointer.x, pointer.y)) {
            this.giveUp();
        }
    }

    giveUpArea() {
        return new Phaser.Geom.Rectangle(GIVE_UP_AREA.x, GIVE_UP_AREA.y, GIVE_UP_AREA.width, GIVE_UP_AREA.height);
    }

    // Returns the board cell under a screen position, or null. The small gaps
    // between the tiles count to the nearest tile.
    cellAt(screenX, screenY) {
        const halfGap = (TILE_SPACING - TILE_SIZE) / 2;
        const x = Math.floor((screenX - BOARD_LEFT + halfGap) / TILE_SPACING);
        const y = Math.floor((screenY - BOARD_TOP + halfGap) / TILE_SPACING);
        const insideBoard = x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
        return insideBoard ? { x, y } : null;
    }

    setPaused(paused) {
        this.paused = paused;
        this.pauseLabel.setVisible(paused);
    }

    setCross(x, y) {
        this.board.toggleCross(x, y);
        this.drawBoard();
        if (this.board.isSolved()) {
            this.levelSolved();
        }
    }

    async levelSolved() {
        this.inputLocked = true;
        await fadeOut(this);

        const pointsPerSecond = session.cheater ? SCORE_PER_SECOND_CHEATER : SCORE_PER_SECOND;
        session.score += this.timeLeft * pointsPerSecond;
        session.level++;

        if (session.level > LEVEL_COUNT) {
            music.stop();
            this.scene.start('End', { solved: true });
        } else if (session.level % PASSWORD_LEVEL_STEP === 0) {
            this.scene.start('Code');
        } else {
            this.startLevel();
        }
    }

    giveUp() {
        if (!this.inputLocked) {
            this.gameOver();
        }
    }

    async gameOver() {
        this.inputLocked = true;
        music.stop();
        await fadeOut(this);
        this.scene.start('End', { solved: false });
    }
}
