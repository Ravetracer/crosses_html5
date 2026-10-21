// The 11x11 playing field. A set cell shows a cross (coloured tile),
// a level is solved when every cell is cleared.

import { BOARD_SIZE } from '../constants.js';

export class Board {
    // rows: array of strings from levels.json, "X" = set, "." = clear
    constructor(rows) {
        this.cells = rows.map((row) => [...row].map((char) => char === 'X'));
    }

    isSet(x, y) {
        return this.cells[y][x];
    }

    // Flips the clicked cell and its four direct neighbours (put_cross in crosses.pas).
    toggleCross(x, y) {
        this.flip(x, y);
        this.flip(x - 1, y);
        this.flip(x + 1, y);
        this.flip(x, y - 1);
        this.flip(x, y + 1);
    }

    flip(x, y) {
        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
            return;
        }
        this.cells[y][x] = !this.cells[y][x];
    }

    isSolved() {
        return this.cells.every((row) => row.every((cell) => !cell));
    }
}
