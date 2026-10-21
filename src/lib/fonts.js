// Bitmap fonts of the original game.
//
// TED fonts (crosses, pass, score): coloured glyphs of varying width, converted from
// the *.chr files. tools/convert_assets.py writes one PNG per font plus a JSON file
// with the position and size of every glyph.
//
// Small font (modern.zei): 8x8 pixel font, exported in white so it can be tinted.

import Phaser from 'phaser';

export const TED_FONTS = ['crosses', 'pass', 'score'];
const SMALL_FONT = 'modern';
const SMALL_GLYPH_SIZE = 8;
const GLYPH_GAP = 1; // TED leaves one empty pixel column after each glyph

export function loadFonts(loader) {
    for (const name of TED_FONTS) {
        loader.image(`font-${name}`, `assets/fonts/${name}.png`);
        loader.json(`font-${name}`, `assets/fonts/${name}.json`);
    }
    loader.image(`font-${SMALL_FONT}`, `assets/fonts/${SMALL_FONT}.png`);
}

// Adds one texture frame per glyph, named after the character.
export function registerFontFrames(textures, cache) {
    for (const name of TED_FONTS) {
        const texture = textures.get(`font-${name}`);
        const glyphs = cache.json.get(`font-${name}`);
        for (const [char, glyph] of Object.entries(glyphs)) {
            texture.add(char, 0, glyph.x, 0, glyph.width, glyph.height);
        }
    }

    const smallFont = textures.get(`font-${SMALL_FONT}`);
    for (let code = 0; code < 256; code++) {
        const x = (code % 16) * SMALL_GLYPH_SIZE;
        const y = Math.floor(code / 16) * SMALL_GLYPH_SIZE;
        smallFont.add(String.fromCharCode(code), 0, x, y, SMALL_GLYPH_SIZE, SMALL_GLYPH_SIZE);
    }
}

// Text in one of the TED fonts, like TED_WRITEXY in tedunit.pas.
export class TedText extends Phaser.GameObjects.Container {
    constructor(scene, x, y, fontName, text = '') {
        super(scene, x, y);
        this.fontName = fontName;
        this.glyphs = scene.cache.json.get(`font-${fontName}`);
        this.text = '';
        this.setText(text);
        scene.add.existing(this);
    }

    hasGlyph(char) {
        return char in this.glyphs;
    }

    setText(text) {
        this.text = text;
        this.removeAll(true);

        let x = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === ' ') {
                // TED has no space glyph: it skips the width of the following character
                x += this.spaceWidth(text[i + 1]) + GLYPH_GAP;
            } else if (this.hasGlyph(char)) {
                const image = this.scene.add.image(x, 0, `font-${this.fontName}`, char).setOrigin(0, 0);
                this.add(image);
                x += this.glyphs[char].width + GLYPH_GAP;
            }
        }
        this.textWidth = x;
        return this;
    }

    spaceWidth(nextChar) {
        if (nextChar && this.hasGlyph(nextChar)) {
            return this.glyphs[nextChar].width;
        }
        return this.glyphs.A.width;
    }
}

// Text in the 8x8 font, like Text_ausgeben in x320x200.pas.
export class SmallText extends Phaser.GameObjects.Container {
    constructor(scene, x, y, text = '', color = 0xffffff) {
        super(scene, x, y);
        this.color = color;
        this.setText(text);
        scene.add.existing(this);
    }

    setText(text) {
        this.removeAll(true);
        for (let i = 0; i < text.length; i++) {
            const glyph = this.scene.add.image(i * SMALL_GLYPH_SIZE, 0, `font-${SMALL_FONT}`, text[i]);
            glyph.setOrigin(0, 0).setTint(this.color);
            this.add(glyph);
        }
        return this;
    }

    setColor(color) {
        this.color = color;
        for (const glyph of this.list) {
            glyph.setTint(color);
        }
        return this;
    }
}

// Converts an [r, g, b] palette entry into a colour number for setTint().
export function rgbToColor([red, green, blue]) {
    return Phaser.Display.Color.GetColor(red, green, blue);
}
