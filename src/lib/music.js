// Plays the original S3M modules with chiptune3 (libopenmpt compiled to WebAssembly).
//
// Browsers only allow audio after a user interaction, so unlock() has to be called
// from a click handler before anything can be heard.

const PLAYER_URL = new URL('vendor/chiptune3/chiptune3.js', document.baseURI).href;

class Music {
    constructor() {
        this.player = null;
        this.playerReady = null;
        this.tracks = new Map();     // track name -> ArrayBuffer with the module file
        this.currentTrack = null;
        this.enabled = true;
    }

    // Switching the music off only mutes it, so the tracks keep changing with the
    // screens and the right one is heard when it is switched on again.
    setEnabled(enabled) {
        this.enabled = enabled;
        if (this.player) {
            this.player.setVol(enabled ? 1 : 0);
        }
    }

    addTrack(name, data) {
        this.tracks.set(name, data);
    }

    // Must be called from inside a user input event (click, key press).
    unlock() {
        if (this.playerReady) {
            return this.playerReady;
        }

        // Create the AudioContext right now, while we are still inside the user event.
        const context = new AudioContext();
        context.resume();

        this.playerReady = this.createPlayer(context);
        return this.playerReady;
    }

    async createPlayer(context) {
        const { ChiptuneJsPlayer } = await import(/* @vite-ignore */ PLAYER_URL);
        const player = new ChiptuneJsPlayer({ context, repeatCount: -1 });

        // When an own context is passed in, chiptune3 does not connect to the speakers itself
        player.gain.connect(context.destination);

        await new Promise((resolve) => player.onInitialized(resolve));
        this.player = player;
        this.setEnabled(this.enabled);

        // A track may have been requested while the player was still loading
        if (this.currentTrack) {
            this.player.play(this.tracks.get(this.currentTrack));
        }
    }

    // Starts a track. Does nothing if that track is already playing.
    play(name) {
        if (this.currentTrack === name) {
            return;
        }
        this.currentTrack = name;
        if (this.player) {
            this.player.play(this.tracks.get(name));
        }
    }

    stop() {
        this.currentTrack = null;
        if (this.player) {
            this.player.stop();
        }
    }
}

export const music = new Music();
