# Crosses (HTML5)

Browser port of "Crosses", a "Lights Out" style puzzle written in Borland Pascal
in 1997 by Ravetracer and Mysterio of Cryptic Deep. It uses the original graphics,
fonts, levels and S3M music, and is played with the mouse.

## Running

```sh
npm install        # also copies the S3M player into public/vendor
npm run dev        # development server
npm run build      # static build in dist/, can be served from any directory
```

## Controls

| Action            | Mouse                          | Keyboard (optional) |
|-------------------|--------------------------------|---------------------|
| Set a cross       | left click on a tile           |                     |
| Pause / continue  | right click / any click        |                     |
| Give up           | click the "CROSSES" logo       | ESC                 |
| Passwords, names  | on-screen keyboard             | type, Enter         |

The button in the top right corner opens the settings (size, pixel smoothing, CRT monitor simulation, music on/off).

## Project layout

- `crosgame/` – the original DOS game and its sources
- `tools/convert_assets.py` – converts the DOS assets into `public/assets`
  (run with `npm run assets`, needs Python 3 with Pillow)
- `src/scenes/` – one Phaser scene per screen; each file names the Pascal
  procedure it is based on
- `src/lib/` – game logic (board, hiscores, session) and helpers (fonts, music, text entry)

Music is played with [chiptune3](https://github.com/DrSnuggles/chiptune)
(libopenmpt compiled to WebAssembly).

## License

MIT, see [LICENSE](LICENSE).
