#!/usr/bin/env python3
"""Compose Path B stack glyphs from atom outlines + tall SMuFL parens.

Reads stacks/allowlist.json (prototype:true entries), extracts tall parens from
Petaluma, lays out top/bottom alteration rows, and writes glyphs/stack_glyphs.py
for build_font.py to merge.

ADR-003: stack *composites* are derived outlines; the allowlist + feature liga
are the stack grammar. Outlines remain swappable.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from fontTools.misc.transform import Transform
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen, replayRecording
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from extract_glyphs import (  # noqa: E402
    DEFAULT_EMBOLDEN,
    extract_outline,
    load_smufl_glyphnames,
    open_font,
    resolve_glyph_name,
)

ALLOWLIST = ROOT / "stacks" / "allowlist.json"
EXTRACTED = ROOT / "glyphs" / "extracted_glyphs.py"
OUT = ROOT / "glyphs" / "stack_glyphs.py"

# Vertical layout inside UPM 1000 (ascent 800 / descent -200).
# Atom .alt/.sup glyphs already sit ~325–750; shift them into two bands.
TOP_DY = -20
BOTTOM_DY = -340
ROW_SCALE = 0.85
PAREN_SCALE = 0.88
INNER_PAD = 14
PAREN_GAP = 8

# Atom → sequence of extracted glyph names (post-cmap, pre-calt style pieces).
ATOM_GLYPHS = {
    "b5": ["flat.alt", "d5.sup"],
    "#5": ["sharp.alt", "d5.sup"],
    "b9": ["flat.alt", "d9.sup"],
    "#9": ["sharp.alt", "d9.sup"],
    "#11": ["sharp.alt", "d1.sup", "d1.sup"],
    "b13": ["flat.alt", "d1.sup", "d3.sup"],
}


def load_extracted():
    if not EXTRACTED.is_file():
        sys.exit(f"ERROR: {EXTRACTED} missing. Run make extract first.")
    sys.path.insert(0, str(ROOT / "glyphs"))
    from extracted_glyphs import ADVANCES, GLYPHS  # noqa: WPS433

    return GLYPHS, ADVANCES


def record_glyph(glyph, glyph_set) -> list:
    pen = RecordingPen()
    glyph.draw(pen, glyph_set)
    return pen.value


def row_width(names: list[str], advances: dict) -> float:
    return float(sum(advances[n] for n in names))


def blit_row(
    dest: TTGlyphPen,
    names: list[str],
    glyphs: dict,
    advances: dict,
    *,
    x0: float,
    dy: float,
    scale: float,
) -> float:
    """Draw a horizontal atom row; return width consumed."""
    x = x0
    for name in names:
        rec = record_glyph(glyphs[name], glyphs)
        t = Transform().translate(x, dy).scale(scale)
        replayRecording(rec, TransformPen(dest, t))
        x += advances[name] * scale
    return x - x0


def extract_tall_parens():
    smufl = load_smufl_glyphnames()
    font = open_font("Petaluma.otf")
    out = {}
    for glyph_name, key in (
        ("parenleft.tall", "csymParensLeftTall"),
        ("parenright.tall", "csymParensRightTall"),
    ):
        resolved = resolve_glyph_name(font, key, smufl)
        glyph, advance, *_ = extract_outline(
            font,
            resolved,
            PAREN_SCALE,
            0,
            40,
            embolden=DEFAULT_EMBOLDEN,
        )
        out[glyph_name] = (glyph, advance)
    return out


def compose_stack(
    top_atom: str,
    bottom_atom: str,
    glyphs: dict,
    advances: dict,
    tall: dict,
) -> tuple:
    top = ATOM_GLYPHS[top_atom]
    bottom = ATOM_GLYPHS[bottom_atom]
    inner_w = max(row_width(top, advances), row_width(bottom, advances)) * ROW_SCALE

    left_g, left_adv = tall["parenleft.tall"]
    right_g, right_adv = tall["parenright.tall"]

    # Stage into a recording first so we can fit the whole composite into the em box.
    stage = RecordingPen()
    x = 0.0

    rec = record_glyph(left_g, {".notdef": left_g})
    replayRecording(rec, TransformPen(stage, Transform().translate(x, 0)))
    x += left_adv + PAREN_GAP

    content_x = x + INNER_PAD
    # blit_row expects TTGlyphPen; replay into stage via a temp glyph
    tmp = TTGlyphPen(None)
    blit_row(tmp, top, glyphs, advances, x0=content_x, dy=TOP_DY, scale=ROW_SCALE)
    blit_row(tmp, bottom, glyphs, advances, x0=content_x, dy=BOTTOM_DY, scale=ROW_SCALE)
    tmp_glyph = tmp.glyph()
    tmp_rec = record_glyph(tmp_glyph, None)
    replayRecording(tmp_rec, stage)
    x = content_x + inner_w + INNER_PAD + PAREN_GAP

    rec = record_glyph(right_g, {".notdef": right_g})
    replayRecording(rec, TransformPen(stage, Transform().translate(x, 0)))
    x += right_adv

    # Fit into ascent/descent band with a small margin.
    probe = TTGlyphPen(None)
    replayRecording(stage.value, probe)
    probe_glyph = probe.glyph()
    bp = BoundsPen(None)
    probe_glyph.draw(bp, None)
    y0, y1 = bp.bounds[1], bp.bounds[3]
    target_top, target_bot = 780.0, -160.0
    span = max(y1 - y0, 1.0)
    fit = min((target_top - target_bot) / span, 1.0)
    # Keep left edge; shift vertically so mid maps into band.
    mid = (y0 + y1) / 2.0
    target_mid = (target_top + target_bot) / 2.0
    dy = target_mid - mid * fit

    pen = TTGlyphPen(None)
    # Affine: scale about origin, then translate in y so the stack sits in-band.
    fit_t = Transform(fit, 0, 0, fit, 0, dy)
    replayRecording(stage.value, TransformPen(pen, fit_t))
    glyph = pen.glyph()
    bp2 = BoundsPen(None)
    glyph.draw(bp2, None)
    advance = int(round(x * fit + 12))
    return glyph, advance, bp2.bounds


def emit_module(glyphs: dict, advances: dict) -> None:
    import base64
    import pickle

    blob = base64.b64encode(
        pickle.dumps({"glyphs": glyphs, "advances": advances}, protocol=4)
    ).decode("ascii")
    OUT.write_text(
        "\n".join(
            [
                "# AUTO-GENERATED by tools/compose_stacks.py — do not edit.",
                "import base64",
                "import pickle",
                "",
                f"_BLOB = {blob!r}",
                "",
                "_data = pickle.loads(base64.b64decode(_BLOB))",
                "GLYPHS = _data['glyphs']",
                "ADVANCES = _data['advances']",
                "",
            ]
        ),
        encoding="utf-8",
    )


def main() -> int:
    allow = json.loads(ALLOWLIST.read_text(encoding="utf-8"))
    proto = [s for s in allow["stacks"] if s.get("prototype")]
    if not proto:
        sys.exit("ERROR: no prototype stacks in allowlist.json")

    glyphs, advances = load_extracted()
    tall = extract_tall_parens()

    out_glyphs = {}
    out_adv = {}
    for spec in proto:
        g, adv, bounds = compose_stack(
            spec["top"], spec["bottom"], glyphs, advances, tall
        )
        name = spec["glyph"]
        out_glyphs[name] = g
        out_adv[name] = adv
        print(f"  {name} <- {spec['canonical_tail']} bounds={bounds} advance={adv}")

    # Also ship tall paren atoms for future non-composite experiments
    for name, (g, adv) in tall.items():
        out_glyphs[name] = g
        out_adv[name] = int(adv)
        print(f"  {name} advance={adv}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    emit_module(out_glyphs, out_adv)
    print(f"Wrote {OUT.relative_to(ROOT)} ({len(out_glyphs)} glyphs)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
