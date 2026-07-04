"""
Minimal proof: a chord-symbol font composing engraved single-line symbols from
ASCII via GSUB only. Outlines are extracted from Petaluma (OFL) via the glyph
pipeline; the OpenType feature code is the asset.
"""
import os
import sys
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString

ROOT = Path(__file__).resolve().parents[1]
EXTRACTED = ROOT / "glyphs" / "extracted_glyphs.py"
OFL = ROOT / "sources" / "petaluma" / "OFL.txt"
UPM = 1000


def box(pen, x0, y0, x1, y1):
    pen.moveTo((x0, y0))
    pen.lineTo((x1, y0))
    pen.lineTo((x1, y1))
    pen.lineTo((x0, y1))
    pen.closePath()


def glyph_from(draw):
    pen = TTGlyphPen(None)
    draw(pen)
    return pen.glyph()


def load_extracted():
    if not EXTRACTED.is_file():
        sys.exit(
            f"ERROR: {EXTRACTED.relative_to(ROOT)} missing. Run 'make extract' first."
        )
    if not OFL.is_file():
        sys.exit(
            f"ERROR: {OFL.relative_to(ROOT)} missing. "
            "Petaluma OFL license required when using extracted glyphs. Run 'make fetch'."
        )
    sys.path.insert(0, str(ROOT / "glyphs"))
    from extracted_glyphs import GLYPHS, ADVANCES  # noqa: WPS433

    return GLYPHS, ADVANCES


extracted, extracted_adv = load_extracted()

roots = list("ABCDEFG")
glyph_order = [".notdef", "space"] + roots + ["m"]
glyphs = {
    ".notdef": glyph_from(lambda p: box(p, 0, 0, 400, 600)),
    "space": glyph_from(lambda p: None),
}
for r in roots:
    if r not in extracted:
        sys.exit(f"ERROR: extracted glyph missing: {r!r}. Run 'make extract'.")
    glyphs[r] = extracted[r]
if "m" not in extracted:
    sys.exit("ERROR: extracted glyph missing: 'm'. Run 'make extract'.")
glyphs["m"] = extracted["m"]
for d in "0123456789":
    glyph_order += [f"d{d}", f"d{d}.sup"]
    for name in (f"d{d}", f"d{d}.sup"):
        if name not in extracted:
            sys.exit(f"ERROR: extracted glyph missing: {name!r}. Run 'make extract'.")
        glyphs[name] = extracted[name]
glyph_order += ["a", "j", "b", "numbersign", "maj.tri", "flat.root", "flat.alt", "sharp.root", "sharp.alt"]
for name in (
    "a",
    "j",
    "b",
    "numbersign",
    "maj.tri",
    "flat.root",
    "flat.alt",
    "sharp.root",
    "sharp.alt",
):
    if name not in extracted:
        sys.exit(f"ERROR: extracted glyph missing: {name!r}. Run 'make extract'.")
    glyphs[name] = extracted[name]

cmap = {ord("A") + i: r for i, r in enumerate(roots)}
cmap[ord(" ")] = "space"
cmap[ord("m")] = "m"
for d in "0123456789":
    cmap[ord(d)] = f"d{d}"
cmap[ord("b")] = "b"
cmap[ord("a")] = "a"
cmap[ord("j")] = "j"
cmap[ord("#")] = "numbersign"
adv = {g: (300 if g == "space" else 520) for g in glyph_order}
for name, width in extracted_adv.items():
    if name in adv:
        adv[name] = width

fb = FontBuilder(UPM, isTTF=True)
fb.setupGlyphOrder(glyph_order)
fb.setupCharacterMap(cmap)
fb.setupGlyf(glyphs)
fb.setupHorizontalMetrics({g: (adv[g], 50) for g in glyph_order})
fb.setupHorizontalHeader(ascent=800, descent=-200)
fb.setupNameTable({"familyName": "ChordProof", "styleName": "Regular"})
fb.setupOS2(sTypoAscender=800, sTypoDescender=-200)
fb.setupPost()

DIGITS = " ".join(f"d{d}" for d in "0123456789")
DIGITS_SUP = " ".join(f"d{d}.sup" for d in "0123456789")
ROOTQUAL = " ".join(roots) + " m maj.tri sharp.root sharp.alt flat.root flat.alt"

fea = f"""
@digit = [{DIGITS}];
@digitsup = [{DIGITS_SUP}];
@rootqual = [{ROOTQUAL}];

feature liga {{
    sub m a j by maj.tri;            # lowercase 'maj' -> engraved triangle
}} liga;

feature calt {{
    sub [A B C D E F G] numbersign' by sharp.root;  # root accidental, tight to letter
    sub [A B C D E F G] b' by flat.root;
    sub b' by flat.alt;              # alteration accidental
    sub numbersign' by sharp.alt;
}} calt;

feature calt {{
    sub @rootqual @digit' by @digitsup;   # superscript digit after root/quality
    sub flat.alt @digit' by @digitsup;
    sub sharp.alt @digit' by @digitsup;
    sub flat.root @digit' by @digitsup;
    sub sharp.root @digit' by @digitsup;
    sub @digitsup @digit' by @digitsup;   # chain: both digits of 13 raise
}} calt;
"""
addOpenTypeFeaturesFromString(fb.font, fea)

os.makedirs("dist", exist_ok=True)
fb.save("dist/ChordProof.ttf")
print("saved dist/ChordProof.ttf")
