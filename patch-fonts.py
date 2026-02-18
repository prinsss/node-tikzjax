# Credit: https://github.com/artisticat1/tikzjax/blob/output-single-file/patchFonts.py
# Execute with "fontforge -lang=py -script patch-fonts.py"

import fontforge
from glob import glob

NOTSIGN = 172
SOFTHYPHEN = 173


def checkGlyphExists(font, glyph):
	try:
		x = font[glyph]
		return True
	except:
		return False


def replaceGlyph(font, glyph1, glyph2):
    glyph1Exists = checkGlyphExists(font, glyph1)
    glyph2Exists = checkGlyphExists(font, glyph2)
    possible = ( glyph1Exists and (not glyph2Exists) )

    if not possible:
        print("Unable to replace glyph.")

        if not glyph1Exists: print("Glyph 1 doesn't exist.")
        if glyph2Exists: print("Glyph 2 already exists.")

        return font

    font.selection.select(glyph1)
    font.copy()
    font.selection.select(glyph2)
    font.paste()

    return font


def getFiles():
    files = glob("./css/bakoma/ttf/*")

    return files


def main():
    files = getFiles()

    for file in files:
        print(file)
        font = fontforge.open(file)
        font = replaceGlyph(font, SOFTHYPHEN, NOTSIGN)
        font.generate(file)

main()
