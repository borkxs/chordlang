#!/usr/bin/env python3
"""
Render a proof sheet: build font → shape chords → dump metrics + an HTML proof page.

Usage:
    python tools/render_proof.py                  # default proof set
    python tools/render_proof.py Cmaj7 Bb7 F#o7   # custom chord list

Outputs dist/proof.html (open in browser) and prints a metrics table to stdout.
"""
from __future__ import annotations

import sys
from pathlib import Path

import uharfbuzz as hb
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
FONT_PATH = ROOT / "dist" / "ChordFont-Real Book.ttf"

DEFAULT_CHORDS = [
    "Cmaj7", "Fmaj7", "Dm7b5", "Bm7b5", "Em7b5", "F#m7b5",
    "Bb7", "Eb7", "F#m7", "G13", "Bb", "Dm7/A",
    "C7alt", "Bb7alt", "Co7", "F#o7", "Cdim7", "F#dim7",
    "C6/9", "Bb6/9", "Csus4", "F#sus4", "Cadd9", "Bbadd9",
    "C13b9", "F#13b9",
]


def load_font():
    if not FONT_PATH.is_file():
        sys.exit(f"ERROR: {FONT_PATH} missing. Run 'make build' first.")
    data = FONT_PATH.read_bytes()
    tt = TTFont(FONT_PATH)
    order = tt.getGlyphOrder()
    font = hb.Font(hb.Face(data))
    return tt, order, font


def shape(font, order, text):
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {"liga": True, "calt": True})
    return " ".join(order[i.codepoint] for i in buf.glyph_infos)


def metrics_table(tt, order, font, chords):
    glyf = tt["glyf"]
    hmtx = tt["hmtx"]
    lines = []
    lines.append(f"{'Chord':<14} {'Shaped glyphs':<50} {'Widths':>6}")
    lines.append("-" * 72)
    all_font_glyphs = set(tt.getGlyphOrder())
    for chord in chords:
        shaped = shape(font, order, chord)
        glyph_names = shaped.split()
        total_w = sum(hmtx[g][0] for g in glyph_names if g in all_font_glyphs)
        lines.append(f"{chord:<14} {shaped:<50} {total_w:>6}")

    lines.append("")
    lines.append(f"{'Glyph':<16} {'adv':>5} {'yMin':>6} {'yMax':>6} {'h':>5}")
    lines.append("-" * 42)
    seen = set()
    for chord in chords:
        shaped = shape(font, order, chord)
        for g in shaped.split():
            if g in seen:
                continue
            seen.add(g)
            gl = glyf[g]
            w = hmtx[g][0]
            lines.append(f"{g:<16} {w:>5} {gl.yMin:>6} {gl.yMax:>6} {gl.yMax - gl.yMin:>5}")
    return "\n".join(lines)


def generate_proof_html(chords):
    cards = "\n".join(
        f'  <div class="card"><div class="chord">{c}</div><div class="label">{c}</div></div>'
        for c in chords
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>ChordFont — GSUB Proof Sheet</title>
<style>
@font-face {{
  font-family: "ChordFont";
  src: url("{FONT_PATH.name}?v={int(FONT_PATH.stat().st_mtime)}") format("truetype");
}}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{
  font-family: system-ui, sans-serif;
  background: #1a1a1a;
  color: #e0e0e0;
  padding: 2rem;
}}
h1 {{ font-size: 1.2rem; font-weight: 600; margin-bottom: .5rem; }}
p.meta {{ font-size: .8rem; color: #888; margin-bottom: 1rem; }}
.proof-grid {{
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: .75rem;
}}
.card {{
  background: #faf8f2;
  color: #1a1a1a;
  border-radius: 6px;
  padding: 1rem .8rem;
  text-align: center;
}}
.chord {{
  font-family: "ChordFont", serif;
  font-feature-settings: "liga" 1, "calt" 1;
  font-size: 2.2rem;
  line-height: 1.4;
  letter-spacing: 0;
}}
.label {{
  font-family: "SF Mono", "Menlo", monospace;
  font-size: .65rem;
  color: #888;
  margin-top: .3rem;
}}
</style>
</head>
<body>
<h1>ChordFont — GSUB Proof Sheet</h1>
<p class="meta">Font: {FONT_PATH.name} &middot; {len(chords)} chords</p>
<div class="proof-grid">
{cards}
</div>
</body>
</html>"""


def main():
    chords = sys.argv[1:] if len(sys.argv) > 1 else DEFAULT_CHORDS

    tt, order, font = load_font()

    print(metrics_table(tt, order, font, chords))

    proof_html = generate_proof_html(chords)
    out = ROOT / "dist" / "proof.html"
    out.write_text(proof_html, encoding="utf-8")
    print(f"\nWrote {out.relative_to(ROOT)}")
    print(f"Serve: cd {ROOT / 'dist'} && python3 -m http.server 8877")


if __name__ == "__main__":
    main()
