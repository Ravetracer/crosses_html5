import Phaser from 'phaser';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from './constants.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { PasswordScene } from './scenes/PasswordScene.js';
import { GameScene } from './scenes/GameScene.js';
import { CodeScene } from './scenes/CodeScene.js';
import { EndScene } from './scenes/EndScene.js';
import { NameEntryScene } from './scenes/NameEntryScene.js';
import { HiscoreScene } from './scenes/HiscoreScene.js';
import { initSettingsPanel } from './settings.js';

const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000000',
    pixelArt: true,
    render: {
        // The CRT overlay copies the finished frame, so it must not be cleared early
        preserveDrawingBuffer: true,
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
        mouse: {
            // The right mouse button pauses the game
            preventDefaultDown: true,
        },
    },
    disableContextMenu: true,
    scene: [
        BootScene,
        TitleScene,
        MenuScene,
        PasswordScene,
        GameScene,
        CodeScene,
        EndScene,
        NameEntryScene,
        HiscoreScene,
    ],
});

game.events.once(Phaser.Core.Events.READY, () => initSettingsPanel(game));
