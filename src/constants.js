// Screen and timing values taken from the original Borland Pascal sources.

// VGA mode 13h
export const SCREEN_WIDTH = 320;
export const SCREEN_HEIGHT = 200;

// The original synchronised its effects to the vertical retrace of the VGA card.
export const RETRACE_RATE = 70;

// fade.pas: 33 palette steps, one per retrace
export const FADE_DURATION = Math.round((33 / RETRACE_RATE) * 1000);

export const BOARD_SIZE = 11;
export const LEVEL_COUNT = 99;
export const PASSWORD_LEVEL_STEP = 5;   // every 5th level shows its password
export const LAST_PASSWORD_LEVEL = 95;

// Board layout: tile (x, y) is drawn at (x * 17 - 8, y * 17 - 8) with 1 based coordinates
export const TILE_SIZE = 14;
export const TILE_SPACING = 17;
export const BOARD_LEFT = 9;
export const BOARD_TOP = 9;
export const TILE_OFF_FRAME = 8;        // sprite used for a cleared tile

// Positions of the numbers in the side panel
export const LEVEL_NUMBER_POSITION = { x: 216, y: 43 };
export const SCORE_NUMBER_POSITION = { x: 216, y: 82 };
export const TIME_NUMBER_POSITION = { x: 276, y: 105 };
export const PAUSE_LABEL_POSITION = { x: 230, y: 130 };

// The "CROSSES" logo at the top of the side panel, clicking it ends the game
export const GIVE_UP_AREA = { x: 195, y: 5, width: 122, height: 20 };

export const SCORE_PER_SECOND = 5;
export const SCORE_PER_SECOND_CHEATER = 1;
export const CHEAT_PASSWORD = 'EMITON';

// Clickable areas of the main menu entries (the bounding boxes of the highlight frames)
export const MENU_ENTRIES = [
    { action: 'start', x: 98, y: 89, width: 125, height: 26 },
    { action: 'hiscore', x: 95, y: 115, width: 131, height: 26 },
    { action: 'exit', x: 102, y: 141, width: 111, height: 26 },
];

export const MUSIC_TRACKS = ['main', 'ingame', 'gameover', 'solved', 'hiscore'];
