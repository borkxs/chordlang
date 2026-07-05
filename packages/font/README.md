# ChordFont

An OpenType font that renders properly-engraved **single-line chord symbols** (`Cmaj7`, `F#m7b5`, `G13`) from plain ASCII input, via GSUB contextual substitution. No JavaScript runtime is required — the font does the work in the shaping engine.

## npm install

```bash
npm install @chordlang/font
```

```css
@font-face {
  font-family: "ChordFont";
  src: url("node_modules/@chordlang/font/fonts/ChordProof.ttf") format("truetype");
}
```

Exports: `@chordlang/font/ChordProof.ttf`, `@chordlang/font/NOTICE` (OFL).

This is distinct from chord-**diagram** fonts (TabFont et al.): we **compose** symbols from glyph parts, not look up pre-drawn fretboard grids.

## How it works

1. Type ASCII chord text in any app that supports OpenType features (`liga`, `calt`).
2. The shaping engine (HarfBuzz, CoreText, DirectWrite, etc.) applies GSUB rules.
3. Ligatures and contextual substitutions transform the glyph stream into an engraved symbol.

Handwritten glyph outlines are extracted from [Petaluma](https://github.com/steinbergmedia/petaluma) (SIL OFL) via a data-driven pipeline. **The OpenType feature code is the asset**; outlines are swappable without touching GSUB rules (see ADR-003, ADR-005).

## Difficulty tiers

| Tier | Mechanism | Status |
|------|-----------|--------|
| **EASY** | Single-sequence ligature (`F#` → F♯) | Straightforward `liga` |
| **MAYBE / HARD** | Contextual superscripting, chained multi-digit extensions, post-accidental digits | **Proven in HarfBuzz — this is our scope** |
| **WALL** | 2D vertical stacking of parenthesized tensions (`G7(♯11)(♭13)`) | **Out of scope for the font** |

The wall is real: OpenType GSUB operates on a 1D glyph stream. Parenthesized tension stacks require 2D layout that a shaping engine cannot provide. For those symbols, fall back to a JS/SVG renderer (see Roadmap).

## Project structure

```
src/build_font.py         # Font builder (imports extracted outlines + GSUB features)
tools/fetch_sources.py    # Download pinned Petaluma OTFs + OFL license
tools/extract_glyphs.py   # Extract/normalize outlines from source_map.json
glyphs/source_map.json    # Glyph name → source font/key/scale/dx/dy
glyphs/extracted_glyphs.py # Generated outline module (make extract)
tests/shape_test.py       # HarfBuzz shaping assertions — this is the spec
grammar/INPUT_GRAMMAR.md  # ASCII chord dialect (shared with any future normalizer)
DECISIONS.md              # Architecture decisions and OSS-vs-build log
NOTICE                    # Petaluma (OFL) attribution for derived outlines
dist/                     # Built .ttf output (gitignored)
sources/petaluma/         # Fetched Petaluma fonts (gitignored except OFL.txt)
```

Three separate concerns (Godot-style data/logic separation):

- **Glyph outlines** — what each component looks like when drawn (`glyphs/source_map.json` + extract)
- **Feature grammar** — OpenType GSUB rules that compose glyphs
- **Input-string grammar** — the ASCII dialect users type (see `grammar/INPUT_GRAMMAR.md`)

## Quick start

```bash
make setup    # create .venv and install deps (first time)
make fetch    # download pinned Petaluma sources + OFL license
make extract  # extract outlines → glyphs/extracted_glyphs.py
make build    # → dist/ChordProof.ttf
make test     # fetch + extract + build + run shaping assertions
```

## How to play

```bash
make play     # build font, copy to playground/, serve at http://localhost:8000
```

Open the printed URL in a browser. Type chord strings in the large input or click the example chips (`Cmaj7`, `Dm7b5`, `F#m7`, `G13`, `Bb`). Toggle **features off** to A/B the raw glyph stream against the shaped result (composed symbol with `liga` + `calt` on).

Glyphs are handwritten outlines derived from Petaluma (OFL). To nudge alignment, edit per-glyph `scale`, `dx`, and `dy` in `glyphs/source_map.json`, then `make build && make play`.

## Shaping test cases (current scope)

| Input | Expected glyph stream |
|-------|----------------------|
| `Cmaj7` | `C maj.tri d7.sup` |
| `Dm7b5` | `D m d7.sup flat.alt d5.sup` |
| `F#m7` | `F sharp.root m d7.sup` |
| `G13` | `G d1.sup d3.sup` |
| `Bb` | `B flat.root` |

Every new feature must land with a passing assertion in `tests/shape_test.py`. CI fails on any mismatch.

## Roadmap

Product vision (not built yet):

- **ChordFont** — sellable engraved symbol font (TabFont-style ~$45 license model; requires redrawing outlines — see ADR-005)
- **Playground web component** — type → live engraved symbol, copy-to-SVG, transpose, Nashville-number toggle
- **JS normalizer** — maps real-world ASCII variants to the font's input dialect (see `grammar/INPUT_GRAMMAR.md`)
- **SVG fallback renderer** — for WALL-tier symbols with parenthesized tension stacks

## Attribution / License

Glyph outlines in the proof font are derived from **Petaluma** (Steinberg Media Technologies GmbH), licensed under the [SIL Open Font License 1.1](sources/petaluma/OFL.txt). See [NOTICE](NOTICE) and [ADR-005](DECISIONS.md) for the OFL fork decision and reserved-name constraints.

Project license: TBD (font derivative must remain OFL-compatible while Petaluma outlines are in use).
