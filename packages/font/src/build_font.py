"""
Multi-style chord-symbol font builder. Composes engraved single-line symbols from
ASCII via GSUB only. Outlines are extracted from Petaluma (OFL) via the glyph
pipeline; the OpenType feature code is the asset.

Supports multiple style variants (realbook, pop, etc.) via --style flag.
"""
import argparse
import json
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
VERSION = "0.1.1"


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


def build_font(style="realbook"):
    """Build font for specified style variant."""
    style_dir = ROOT / "styles" / style
    config_path = style_dir / "config.json"
    features_path = style_dir / "features.fea"
    
    if not config_path.is_file():
        sys.exit(f"ERROR: Style config not found: {config_path}")
    if not features_path.is_file():
        sys.exit(f"ERROR: Style features not found: {features_path}")
    
    with open(config_path) as f:
        config = json.load(f)
    
    extracted, extracted_adv = load_extracted()
    
    roots = list("ABCDEFG")
    glyph_order = [".notdef", "space"] + roots
    glyphs = {
        ".notdef": glyph_from(lambda p: box(p, 0, 0, 400, 600)),
        "space": glyph_from(lambda p: None),
    }
    
    for r in roots:
        if r not in extracted:
            sys.exit(f"ERROR: extracted glyph missing: {r!r}. Run 'make extract'.")
        glyphs[r] = extracted[r]
    
    # Style-specific quality glyphs
    major_glyph = config["glyphs"]["major_quality"]
    minor_glyph = config["glyphs"]["minor_quality"]
    
    # Add quality glyphs based on style
    if major_glyph == "M":
        glyph_order.append("M")
        if "M" not in extracted:
            sys.exit("ERROR: extracted glyph missing: 'M'. Run 'make extract'.")
        glyphs["M"] = extracted["M"]
    
    glyph_order.append("m")
    if "m" not in extracted:
        sys.exit("ERROR: extracted glyph missing: 'm'. Run 'make extract'.")
    glyphs["m"] = extracted["m"]
    
    # Digits
    for d in "0123456789":
        glyph_order += [f"d{d}", f"d{d}.sup"]
        for name in (f"d{d}", f"d{d}.sup"):
            if name not in extracted:
                sys.exit(f"ERROR: extracted glyph missing: {name!r}. Run 'make extract'.")
            glyphs[name] = extracted[name]
    
    # Common glyphs needed by all styles
    EXTRA_GLYPHS = [
        "a", "j", "b", "d.lc", "i", "l", "n", "o", "s", "t", "u",
        "numbersign", "slash",
        "maj.tri", "dim.ring",
        "flat.root", "flat.alt", "sharp.root", "sharp.alt",
        "a.sup", "l.sup", "t.sup", "slash.sup",
    ]
    glyph_order += EXTRA_GLYPHS
    for name in EXTRA_GLYPHS:
        if name not in extracted:
            sys.exit(f"ERROR: extracted glyph missing: {name!r}. Run 'make extract'.")
        glyphs[name] = extracted[name]
    
    # Character map
    cmap = {ord("A") + i: r for i, r in enumerate(roots)}
    cmap[ord(" ")] = "space"
    cmap[ord("M")] = "M" if major_glyph == "M" else "m"
    cmap[ord("m")] = "m"
    for d in "0123456789":
        cmap[ord(d)] = f"d{d}"
    cmap[ord("a")] = "a"
    cmap[ord("b")] = "b"
    cmap[ord("d")] = "d.lc"
    cmap[ord("i")] = "i"
    cmap[ord("j")] = "j"
    cmap[ord("l")] = "l"
    cmap[ord("n")] = "n"
    cmap[ord("o")] = "o"
    cmap[ord("s")] = "s"
    cmap[ord("t")] = "t"
    cmap[ord("u")] = "u"
    cmap[ord("#")] = "numbersign"
    cmap[ord("/")] = "slash"
    
    adv = {g: (300 if g == "space" else 520) for g in glyph_order}
    for name, width in extracted_adv.items():
        if name in adv:
            adv[name] = width
    
    # Build font
    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(glyph_order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics({g: (adv[g], 50) for g in glyph_order})
    fb.setupHorizontalHeader(ascent=800, descent=-200)
    
    display_name = config["display_name"]
    family_name = f"ChordFont-{display_name}"
    # PostScript names cannot contain spaces (e.g. "Real Book" → "RealBook").
    ps_name = f"{family_name.replace(' ', '')}-Regular"
    # Full name (ID 4) and PostScript name (ID 6) are required by consumers that
    # look fonts up outside the browser: LuaLaTeX's HarfBuzz renderer, Typst's
    # font discovery, and LilyPond's PS backend all fail without them.
    fb.setupNameTable(
        {
            "familyName": family_name,
            "styleName": "Regular",
            "uniqueFontIdentifier": f"{VERSION};CHRD;{ps_name}",
            "fullName": f"{family_name} Regular",
            "version": f"Version {VERSION}",
            "psName": ps_name,
        }
    )
    fb.setupOS2(sTypoAscender=800, sTypoDescender=-200)
    fb.setupPost()
    
    # Load and apply features
    DIGITS = " ".join(f"d{d}" for d in "0123456789")
    DIGITS_SUP = " ".join(f"d{d}.sup" for d in "0123456789")
    
    # Include M only for styles that use it
    if major_glyph == "M":
        QUAL_LETTERS = "M m a j b d.lc i l n o s t u"
    else:
        QUAL_LETTERS = "m a j b d.lc i l n o s t u"
    
    ROOTQUAL = " ".join(roots) + " " + QUAL_LETTERS + " maj.tri dim.ring sharp.root sharp.alt flat.root flat.alt"
    
    with open(features_path) as f:
        fea_template = f.read()
    
    fea = fea_template.format(DIGITS=DIGITS, DIGITS_SUP=DIGITS_SUP, ROOTQUAL=ROOTQUAL)
    addOpenTypeFeaturesFromString(fb.font, fea)
    
    # Save
    os.makedirs("dist", exist_ok=True)
    output_path = f"dist/ChordFont-{display_name}.ttf"
    fb.save(output_path)
    print(f"saved {output_path}")
    return output_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build ChordFont style variant")
    parser.add_argument(
        "--style",
        default="realbook",
        choices=["realbook", "pop"],
        help="Font style variant to build (default: realbook)"
    )
    args = parser.parse_args()
    build_font(args.style)
