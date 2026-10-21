#!/usr/bin/env python3
"""
Converts the original DOS assets of "Crosses" into web friendly formats.

Usage: python3 tools/convert_assets.py <original game dir> <output dir>

Input formats (all from the Borland Pascal sources):
  *.pcx        320x200 images with 256 colour palette
  sprites.crs  9 tiles (14x14) + 1 mouse pointer (8x8) in "Put_Image" format:
               word width, word height, then width*height palette indices
  *.chr        TED fonts: 20 byte header, then per glyph: char, width, height, pixels
  *.256        VGA palette (256 * RGB, 6 bit per channel)
  modern.zei   8x8 bitmap font, 256 chars * 8 bytes (one byte per row)
  levels.crs   99 Turbo Pascal records (see LEVEL_RECORD_SIZE)
  *.s3m        music, copied unchanged
"""

import json
import shutil
import struct
import sys
from pathlib import Path

from PIL import Image

SCREENS = ["titel", "menu", "field", "gameover", "solved", "hiscore"]
MUSIC = ["main", "ingame", "gameover", "solved", "hiscore"]

# Palette indices the original program animated at runtime
MENU_BOX_COLORS = [92, 93, 94]           # outlines around the three menu entries
TITLE_TEXT_COLORS = range(122, 161)      # "press any key" fade on the title screen
HISCORE_TEXT_COLORS = range(192, 224)    # colour cycling of the hiscore entries

TILE_SIZE = 14
TILE_COUNT = 9
TILE_RECORD_SIZE = 200                   # 4 byte header + 14*14 pixels
SMILEY_TILE = 5

BOARD_SIZE = 11
LEVEL_COUNT = 99
# pos: 11*11 booleans, til: byte, time: LongInt, password: String[8] (length byte + 8 chars)
LEVEL_RECORD_SIZE = BOARD_SIZE * BOARD_SIZE + 1 + 4 + 9


def vga6_to_rgb8(values):
    """VGA DAC values are 6 bit (0..63), the browser wants 0..255."""
    return [round(value * 255 / 63) for value in values]


def palette_color(palette, index):
    red, green, blue = palette[index * 3: index * 3 + 3]
    return [red, green, blue]


def indexed_to_rgba(width, height, pixels, palette, transparent_index=None):
    """Turns a list of palette indices into an RGBA image."""
    image = Image.new("RGBA", (width, height))
    for y in range(height):
        for x in range(width):
            index = pixels[y * width + x]
            if index == transparent_index:
                image.putpixel((x, y), (0, 0, 0, 0))
            else:
                red, green, blue = palette_color(palette, index)
                image.putpixel((x, y), (red, green, blue, 255))
    return image


def convert_screens(source, images_dir):
    palettes = {}
    for name in SCREENS:
        pcx = Image.open(source / f"{name}.pcx")
        pcx.convert("RGB").save(images_dir / f"{name}.png")
        palettes[name] = pcx.getpalette()
    return palettes


def convert_menu_boxes(source, images_dir):
    """
    The menu highlight boxes are drawn in the picture with colours 92..94, which are
    black in the palette. The original made one visible by changing its palette entry.
    We export each box as a white mask that the game can tint.
    """
    menu = Image.open(source / "menu.pcx")
    width, height = menu.size
    pixels = list(menu.getdata())
    for number, color_index in enumerate(MENU_BOX_COLORS, start=1):
        mask = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        for y in range(height):
            for x in range(width):
                if pixels[y * width + x] == color_index:
                    mask.putpixel((x, y), (255, 255, 255, 255))
        mask.save(images_dir / f"menu-box-{number}.png")


def convert_sprites(source, images_dir, field_palette):
    """The sprites use the palette of field.pcx, which was active during the game."""
    data = (source / "sprites.crs").read_bytes()

    sheet = Image.new("RGBA", (TILE_SIZE * TILE_COUNT, TILE_SIZE))
    for tile in range(TILE_COUNT):
        offset = tile * TILE_RECORD_SIZE
        width, height = struct.unpack_from("<HH", data, offset)
        pixels = data[offset + 4: offset + 4 + width * height]
        sheet.paste(indexed_to_rgba(width, height, pixels, field_palette), (tile * TILE_SIZE, 0))
    sheet.save(images_dir / "tiles.png")

    # The smiley tile doubles as the browser tab icon
    smiley = sheet.crop((SMILEY_TILE * TILE_SIZE, 0, (SMILEY_TILE + 1) * TILE_SIZE, TILE_SIZE))
    smiley.resize((TILE_SIZE * 4, TILE_SIZE * 4), Image.NEAREST).save(images_dir / "favicon.png")

    # The pointer was drawn with PutTransparent, colour 0 is see-through
    offset = TILE_COUNT * TILE_RECORD_SIZE
    width, height = struct.unpack_from("<HH", data, offset)
    pixels = data[offset + 4: offset + 4 + width * height]
    indexed_to_rgba(width, height, pixels, field_palette, transparent_index=0).save(images_dir / "pointer.png")


def read_ted_font(path):
    """Returns a list of (char, width, height, pixels) tuples."""
    data = path.read_bytes()
    glyphs = []
    position = 20  # skip the TED header
    while position < len(data):
        char, width, height = data[position], data[position + 1], data[position + 2]
        position += 3
        pixels = data[position: position + width * height]
        position += width * height
        glyphs.append((chr(char), width, height, pixels))
    return glyphs


def convert_ted_font(source, fonts_dir, name, palette):
    """Writes all glyphs side by side into one PNG plus a JSON with their positions."""
    glyphs = read_ted_font(source / f"{name}.chr")
    sheet_width = sum(width for _, width, _, _ in glyphs)
    sheet_height = max(height for _, _, height, _ in glyphs)

    sheet = Image.new("RGBA", (sheet_width, sheet_height), (0, 0, 0, 0))
    metrics = {}
    x = 0
    for char, width, height, pixels in glyphs:
        sheet.paste(indexed_to_rgba(width, height, pixels, palette, transparent_index=0), (x, 0))
        metrics[char] = {"x": x, "width": width, "height": height}
        x += width

    sheet.save(fonts_dir / f"{name}.png")
    (fonts_dir / f"{name}.json").write_text(json.dumps(metrics, indent=1))


def convert_8x8_font(source, fonts_dir):
    """modern.zei: 256 glyphs, exported as a white 16x16 grid so the game can tint it."""
    data = (source / "modern.zei").read_bytes()
    sheet = Image.new("RGBA", (16 * 8, 16 * 8), (0, 0, 0, 0))
    for code in range(256):
        cell_x = (code % 16) * 8
        cell_y = (code // 16) * 8
        for row in range(8):
            row_bits = data[code * 8 + row]
            for column in range(8):
                if row_bits & (128 >> column):
                    sheet.putpixel((cell_x + column, cell_y + row), (255, 255, 255, 255))
    sheet.save(fonts_dir / "modern.png")


def decode_password(raw):
    """Passwords were stored with each char shifted by its (1 based) position."""
    return "".join(chr(code - position) for position, code in enumerate(raw, start=1)).upper()


def convert_levels(source, data_dir):
    data = (source / "levels.crs").read_bytes()
    levels = []
    for number in range(LEVEL_COUNT):
        record = data[number * LEVEL_RECORD_SIZE: (number + 1) * LEVEL_RECORD_SIZE]

        # pos[x, y] with x as the outer index, so byte (x - 1) * 11 + (y - 1)
        rows = []
        for y in range(BOARD_SIZE):
            row = ""
            for x in range(BOARD_SIZE):
                row += "X" if record[x * BOARD_SIZE + y] else "."
            rows.append(row)

        tile = record[121]
        time = struct.unpack_from("<i", record, 122)[0]
        password_length = record[126]
        password = decode_password(record[127: 127 + password_length])
        levels.append({"tile": tile, "time": time, "password": password, "board": rows})

    (data_dir / "levels.json").write_text(json.dumps(levels, indent=1))


def convert_palettes(screen_palettes, data_dir):
    """Colours the game animates at runtime, as [r, g, b] lists."""
    animated = {
        "titleText": [palette_color(screen_palettes["titel"], index) for index in TITLE_TEXT_COLORS],
        "hiscoreText": [palette_color(screen_palettes["hiscore"], index) for index in HISCORE_TEXT_COLORS],
    }
    (data_dir / "palettes.json").write_text(json.dumps(animated))


def copy_music(source, music_dir):
    for name in MUSIC:
        shutil.copyfile(source / f"{name}.s3m", music_dir / f"{name}.s3m")


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)

    source = Path(sys.argv[1])
    output = Path(sys.argv[2])
    images_dir = output / "images"
    fonts_dir = output / "fonts"
    data_dir = output / "data"
    music_dir = output / "music"
    for directory in (images_dir, fonts_dir, data_dir, music_dir):
        directory.mkdir(parents=True, exist_ok=True)

    screen_palettes = convert_screens(source, images_dir)
    convert_menu_boxes(source, images_dir)
    convert_sprites(source, images_dir, screen_palettes["field"])

    # The menu scroller font had no palette of its own, it used the one of menu.pcx
    convert_ted_font(source, fonts_dir, "crosses", screen_palettes["menu"])
    for name in ("pass", "score"):
        palette = vga6_to_rgb8((source / f"{name}.256").read_bytes())
        convert_ted_font(source, fonts_dir, name, palette)
    convert_8x8_font(source, fonts_dir)

    convert_levels(source, data_dir)
    convert_palettes(screen_palettes, data_dir)
    copy_music(source, music_dir)
    print(f"Assets written to {output}")


if __name__ == "__main__":
    main()
