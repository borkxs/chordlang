#!/usr/bin/env python3
"""Extract and normalize glyph outlines from Petaluma sources per glyphs/source_map.json."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from fontTools.misc.transform import Transform
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.recordingPen import DecomposingRecordingPen, replayRecording
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "sources" / "petaluma"
SMUFL_GLYPHNAMES = ROOT / "sources" / "smufl" / "glyphnames.json"
SOURCE_MAP = ROOT / "glyphs" / "source_map.json"
OFL = SOURCES / "OFL.txt"
OUT = ROOT / "glyphs" / "extracted_glyphs.py"
TARGET_UPM = 1000

SUPERSCRIPT_SCALE = 0.6
SUPERSCRIPT_RAISE = 360  # y offset in target UPM units


def require_ofl() -> None:
    if not OFL.is_file():
        sys.exit(
            f"ERROR: {OFL} missing. Run 'make fetch' to download Petaluma OFL license."
        )


def load_source_map() -> dict:
    with SOURCE_MAP.open(encoding="utf-8") as f:
        return json.load(f)


def open_font(filename: str) -> TTFont:
    path = SOURCES / filename
    if not path.is_file():
        sys.exit(f"ERROR: source font missing: {path}. Run 'make fetch'.")
    return TTFont(path)


def load_smufl_glyphnames() -> dict:
    if not SMUFL_GLYPHNAMES.is_file():
        sys.exit(
            f"ERROR: {SMUFL_GLYPHNAMES} missing. Run 'make fetch' to download SMuFL metadata."
        )
    with SMUFL_GLYPHNAMES.open(encoding="utf-8") as f:
        return json.load(f)


def resolve_glyph_name(font: TTFont, source_key: str, smufl: dict) -> str:
    glyph_order = font.getGlyphOrder()
    if len(source_key) == 1:
        cmap = font.getBestCmap() or {}
        code = ord(source_key)
        if code not in cmap:
            available = sorted({chr(c) for c in cmap if 32 <= c < 127})
            sys.exit(
                f"ERROR: char {source_key!r} (U+{code:04X}) not in cmap of "
                f"{font.reader.file.name}.\n"
                f"Available ASCII cmap chars: {''.join(available)}"
            )
        return cmap[code]

    if source_key in glyph_order:
        return source_key

    if source_key in smufl:
        cp = int(smufl[source_key]["codepoint"].replace("U+", ""), 16)
        cmap = font.getBestCmap() or {}
        if cp in cmap:
            return cmap[cp]
        sys.exit(
            f"ERROR: SMuFL glyph {source_key!r} (U+{cp:04X}) not in cmap of "
            f"{font.reader.file.name}.\n"
            f"Fix glyphs/source_map.json."
        )

    smufl_hits = [name for name in smufl if source_key.lower() in name.lower()]
    hint = ""
    if smufl_hits:
        hint = f"\nSMuFL name matches: {smufl_hits[:20]}"
    sys.exit(
        f"ERROR: glyph key {source_key!r} not found in "
        f"{font.reader.file.name}.\n"
        f"Not in glyph order, cmap, or SMuFL glyphnames.json.{hint}\n"
        f"Glyph order ({len(glyph_order)} glyphs). First 40:\n"
        f"  {glyph_order[:40]}\n"
        f"Fix glyphs/source_map.json."
    )


def extract_outline(
    font: TTFont,
    glyph_name: str,
    scale: float,
    dx: float,
    dy: float,
) -> tuple:
    glyph_set = font.getGlyphSet()
    if glyph_name not in glyph_set:
        sys.exit(f"ERROR: resolved glyph {glyph_name!r} not in glyph set.")

    recorder = DecomposingRecordingPen(glyph_set)
    glyph_set[glyph_name].draw(recorder)
    recording = recorder.value

    source_upm = font["head"].unitsPerEm
    upm_scale = TARGET_UPM / source_upm
    total_scale = scale * upm_scale
    transform = Transform(total_scale, 0, 0, total_scale, dx, dy)

    tt_pen = TTGlyphPen(None)
    cu2qu = Cu2QuPen(tt_pen, max_err=1.0, reverse_direction=False)
    transform_pen = TransformPen(cu2qu, transform)
    replayRecording(recording, transform_pen)
    glyph = tt_pen.glyph()

    source_width = font["hmtx"][glyph_name][0]
    advance = int(round(source_width * total_scale))
    if advance <= 0:
        advance = int(round(520 * scale))

    return glyph, advance, recording, total_scale, dx, dy


def apply_advance_override(advance: int, spec: dict) -> int:
    override = spec.get("advance")
    if override is not None:
        return int(override)
    return advance


def derive_superscript(recording, full_advance: int, total_scale: float, dx: float, dy: float):
    """Scale full digit to ~0.6 and raise for superscript height."""
    base = Transform(total_scale, 0, 0, total_scale, dx, dy)
    sup = Transform(
        SUPERSCRIPT_SCALE, 0, 0, SUPERSCRIPT_SCALE, 0, SUPERSCRIPT_RAISE
    )
    transform = sup.transform(base)

    tt_pen = TTGlyphPen(None)
    cu2qu = Cu2QuPen(tt_pen, max_err=1.0, reverse_direction=False)
    transform_pen = TransformPen(cu2qu, transform)
    replayRecording(recording, transform_pen)
    glyph = tt_pen.glyph()
    advance = int(round(full_advance * SUPERSCRIPT_SCALE))
    return glyph, advance


def emit_module(glyphs: dict, advances: dict) -> None:
    import base64
    import pickle

    payload = pickle.dumps({"glyphs": glyphs, "advances": advances}, protocol=4)
    blob = base64.b64encode(payload).decode("ascii")
    lines = [
        '"""Auto-generated by tools/extract_glyphs.py — do not edit."""',
        "",
        "import base64",
        "import pickle",
        "",
        f"_BLOB = {blob!r}",
        "",
        "_data = pickle.loads(base64.b64decode(_BLOB))",
        "GLYPHS = _data['glyphs']",
        "ADVANCES = _data['advances']",
        "TARGET_UPM = 1000",
        "",
    ]
    OUT.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    require_ofl()
    source_map = load_source_map()
    smufl = load_smufl_glyphnames()

    fonts: dict[str, TTFont] = {}
    glyphs: dict = {}
    advances: dict = {}
    sup_recordings: dict = {}

    for glyph_name, spec in source_map.items():
        if glyph_name.startswith("_"):
            continue
        src_font = spec["source_font"]
        if src_font not in fonts:
            fonts[src_font] = open_font(src_font)
        font = fonts[src_font]

        resolved = resolve_glyph_name(font, spec["source_key"], smufl)
        glyph, advance, recording, total_scale, dx, dy = extract_outline(
            font,
            resolved,
            float(spec.get("scale", 1.0)),
            float(spec.get("dx", 0)),
            float(spec.get("dy", 0)),
        )
        advance = apply_advance_override(advance, spec)
        glyphs[glyph_name] = glyph
        advances[glyph_name] = advance
        is_digit = glyph_name.startswith("d") and len(glyph_name) == 2 and glyph_name[1].isdigit()
        if is_digit or spec.get("derive_sup"):
            sup_recordings[glyph_name] = (recording, total_scale, dx, dy)
        print(f"  {glyph_name} <- {src_font}:{resolved}")

    # Derive superscript variants for digits and flagged glyphs
    for base_name, (recording, total_scale, dx, dy) in sup_recordings.items():
        sup_name = f"{base_name}.sup"
        if sup_name in source_map:
            continue
        sup_glyph, sup_adv = derive_superscript(
            recording, advances[base_name], total_scale, dx, dy
        )
        glyphs[sup_name] = sup_glyph
        advances[sup_name] = sup_adv
        print(f"  {sup_name} <- derived from {base_name}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    emit_module(glyphs, advances)
    print(f"Wrote {OUT.relative_to(ROOT)} ({len(glyphs)} glyphs)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
