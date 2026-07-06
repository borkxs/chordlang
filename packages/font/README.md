# ChordFont

An OpenType font that renders properly-engraved **single-line chord symbols** (`Cmaj7`, `F#m7b5`, `G13`) from plain ASCII input, via GSUB contextual substitution. No JavaScript runtime is required — the font does the work in the shaping engine.

**Style variants:** ChordFont ships multiple style variants to match different notation conventions:

- **Real Book** ([`ChordFont-Real Book.ttf`](fonts/ChordFont-Real%20Book.ttf)) — Modern jazz lead sheet standard with △ for major, baseline extensions
- **Pop** ([`ChordFont-Pop.ttf`](fonts/ChordFont-Pop.ttf)) — Pop/rock conventions with "M" for major, all extensions superscripted

See `styles/*/CONVENTIONS.md` for engraving rules and reference materials for each style.

**Try it live:** [Playground demo](https://borkxs.github.io/chordlang) with style selector

## npm install

```bash
npm install @chordlang/font
```

```css
/* Real Book style (jazz) */
@font-face {
  font-family: "ChordFont-RealBook";
  src: url("node_modules/@chordlang/font/fonts/ChordFont-Real Book.ttf") format("truetype");
}

/* Pop style */
@font-face {
  font-family: "ChordFont-Pop";
  src: url("node_modules/@chordlang/font/fonts/ChordFont-Pop.ttf") format("truetype");
}
```

Exports: `@chordlang/font/ChordFont-Real Book.ttf`, `@chordlang/font/ChordFont-Pop.ttf`, `@chordlang/font/NOTICE` (OFL).

Choose the font variant that matches your musical genre and notation conventions.

This is distinct from chord-**diagram** fonts (TabFont et al.): we **compose** symbols from glyph parts, not look up pre-drawn fretboard grids.

## Style Comparison

| Notation | Real Book | Pop |
|----------|-----------|-----|
| Major 7th | `Cmaj7` → C△7 | `CM7` → CM⁷ |
| Dominant 7th | `C7` → C7 (baseline) | `C7` → C⁷ (superscript) |
| Extensions | `C13` → C13 (baseline) | `C13` → C¹³ (superscript) |
| Minor 7th | `Dm7` → Dm7 | `Dm7` → Dm⁷ |
| Use case | Jazz lead sheets | Pop/rock charts |
| Examples | Giant Steps, All The Things You Are | Yesterday, God Only Knows, Let It Be |

**Download fonts:**
- [Real Book (19 KB)](fonts/ChordFont-Real%20Book.ttf)
- [Pop (19 KB)](fonts/ChordFont-Pop.ttf)

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
styles/realbook/          # Real Book engraving style conventions (current default)
references/               # Visual reference materials from published sources (fair use)
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
make setup          # create .venv and install deps (first time)
make fetch          # download pinned Petaluma sources + OFL license
make extract        # extract outlines → glyphs/extracted_glyphs.py
make build          # build all style variants → dist/ChordFont-*.ttf
make build-realbook # build only Real Book style
make build-pop      # build only Pop style
make test           # fetch + extract + build + run shaping assertions
```

## How to play

```bash
make play     # build font, copy to playground/, serve at http://localhost:8000
```

Open the printed URL in a browser. Type chord strings in the large input or click the example chips (`Cmaj7`, `Dm7b5`, `F#m7`, `G13`, `Bb`). Toggle **features off** to A/B the raw glyph stream against the shaped result (composed symbol with `liga` + `calt` on).

Glyphs are handwritten outlines derived from Petaluma (OFL). To nudge alignment, edit per-glyph `scale`, `dx`, and `dy` in `glyphs/source_map.json`, then `make build && make play`.

## Shaping test cases (current scope)

### Real Book style ([download](fonts/ChordFont-Real%20Book.ttf))

| Input | Output | Notes |
|-------|--------|-------|
| `Cmaj7` | C△7 | Triangle, baseline 7 |
| `Dm7b5` | Dm7♭⁵ | Alterations superscripted |
| `F#m7` | F♯m7 | Root sharp, baseline 7 |
| `G13` | G13 | Extensions at baseline |
| `Bb7` | B♭7 | Root flat |

### Pop style ([download](fonts/ChordFont-Pop.ttf))

| Input | Output | Notes |
|-------|--------|-------|
| `CM7` | CM⁷ | Uppercase M, superscript 7 |
| `Dm7` | Dm⁷ | All extensions superscripted |
| `F#m7` | F♯m⁷ | Root sharp, superscript 7 |
| `G13` | G¹³ | All extensions superscripted |
| `Bb7` | B♭⁷ | Root flat, superscript 7 |

**Examples in the wild:**
- Real Book: [All The Things You Are](../../examples/charts/all-the-things-realbook.cfmd), [Giant Steps](../../examples/charts/giant-steps.cfmd)
- Pop: [Yesterday](../../examples/charts/yesterday-pop.cfmd), [God Only Knows](../../examples/charts/god-only-knows-pop.cfmd), [Let It Be](../../examples/charts/let-it-be-pop.cfmd)

Every new feature must land with a passing assertion in `tests/shape_test.py`. CI fails on any mismatch.

## Visual atlas (feedback loop)

For exhaustive proofing across all roots and suffix patterns — especially when
iterating with an agent — run from the **repo root**:

```bash
make font-atlas
```

Writes `dist/atlas.png`, `dist/atlas.html`, and `dist/atlas-symbols.json`
(gitignored). Step-by-step loop, CLI flags, and how to extend the symbol matrix:
[`tools/font-atlas/README.md`](../../tools/font-atlas/README.md).

## Roadmap

Product vision (not built yet):

- **ChordFont** — sellable engraved symbol font (TabFont-style ~$45 license model; requires redrawing outlines — see ADR-005)
- **Playground web component** — type → live engraved symbol, copy-to-SVG, transpose, Nashville-number toggle
- **JS normalizer** — maps real-world ASCII variants to the font's input dialect (see `grammar/INPUT_GRAMMAR.md`)
- **SVG fallback renderer** — for WALL-tier symbols with parenthesized tension stacks

## Attribution / License

Glyph outlines in the proof font are derived from **Petaluma** (Steinberg Media Technologies GmbH), licensed under the [SIL Open Font License 1.1](sources/petaluma/OFL.txt). See [NOTICE](NOTICE) and [ADR-005](DECISIONS.md) for the OFL fork decision and reserved-name constraints.

Project license: TBD (font derivative must remain OFL-compatible while Petaluma outlines are in use).
