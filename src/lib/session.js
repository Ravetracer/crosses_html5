// State of the running game, shared between the scenes.

export const session = {
    level: 1,          // 1 based, like in the original
    score: 0,

    // Set by the cheat password. Like in the original it stays active until the
    // program (here: the browser tab) is closed.
    cheater: false,

    startNewGame(level) {
        this.level = level;
        this.score = 0;
    },
};
