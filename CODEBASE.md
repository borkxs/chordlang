# Codebase guide

pnpm monorepo (`pnpm-workspace.yaml` includes `packages/*` and `apps/*`).
Six library packages, a CLI, and a playground app.

## Data flow

```
text input
    │  parseChart(src)
    ▼
ChartAST { directives[], body: (Bar | Section | barline-end)[] }
    │  renderChartToHTML(ast, { normalize })
    │  ├── for each cell: normalize(symbol) → Canonical
    │  └── emit ASCII chord in <span class="chordlang-symbol">
    ▼
HTML string
    │  browser renders with ChordFont @font-face
    │  (packages/font builds the TTF; GSUB ligatures engrave glyphs)
    ▼
engraved chord chart
```

## Packages

### `packages/parser` — chart grammar → AST

- `src/chart.peggy` — **this file IS the format spec** (ADR-003). Parses
  structure only; chord tokens are opaque strings.
- `src/generated/chart.mjs` — Peggy output, built by `make grammar`.
- `src/index.ts` — exports `parseChart()` and the AST types
  (`ChartAST`, `Bar`, `Section`, `Cell`, `BodyItem`).

Key grammar rules:
- `{key: value}` directives (ChordPro-style)
- `[A]` section labels (iReal-style form markers)
- `| chord | chord,chord |` bars; commas subdivide into equal beat-slots
- `%` = repeat previous bar, `.` = hold/empty slot
- A trailing `|` with no cells produces a `barline-end` node, used by the
  renderer to know where a row of bars ends (closing barline).

### `packages/chord` — symbol normalizer

- Wraps `tonal` (the `Chord.get` parser).
- **Pre-fold**: collapses dialect variants before tonal sees them
  (Δ/^/△ → maj, ø → m7b5, ° → dim, C-7 → Cm7).
- **Post-fold**: maps tonal output to `Canonical` struct with multiple
  render forms (ascii, display with Unicode, Harte, MusicXML kind).
- Special handling: `7alt` flagged as `underspecified` (doesn't fabricate a
  voicing); `ø7` and `m7b5` normalize identically (factor-based equivalence).
- Slash chords: distinguishes inversion (`C/E`, bass is a chord tone) vs.
  added bass (`C/D`).
- Factor signature lookup table (`NAMES`) maps known voicings to canonical
  display/harte/kind.

### `packages/render` — AST → engraved HTML

- `src/index.ts` — exports `renderChartToHTML()`.
- `chart.css` — shared chart grid + ChordFont styling (used by playground and
  `make previews`).
- Emits a `<div class="chordlang-grid">` containing section labels and bars.
- Bars followed by `barline-end` (or a section, or end-of-body) get the
  `chordlang-bar-end` class for the closing barline border.
- Chord symbols are emitted as ASCII text; the font's OpenType ligatures
  handle the visual engraving. Consumer supplies `@font-face` for "ChordFont".
- Lenient mode renders unparseable tokens with an `chordlang-error` class
  instead of throwing.

### `packages/graph` — Graphviz DOT → styled SVG

- `src/index.ts` — `loadGraphviz()`, `renderDot()`, `renderDotToSvg()`, `styleSvg()`.
- `graph.css` — consumer styles for ChordFont-labelled SVG text nodes.
- Used by the playground graph demo and `make graphs` gallery script.

### `packages/font` — chord symbol OpenType font (Python + npm)

- Builds `dist/ChordProof.ttf` — an OpenType font whose GSUB ligatures
  transform ASCII chord text into engraved music-notation glyphs.
- Glyph outlines derived from Petaluma (Steinberg), SIL Open Font License.
- Build chain: `make fetch` → download pinned Petaluma sources,
  `make extract` → pull glyph outlines into `glyphs/extracted_glyphs.py`,
  `make build` → assemble TTF with fonttools and copy to playground.
- `make test` runs HarfBuzz shaping tests (`uharfbuzz`) to verify ligature
  substitution produces correct glyph sequences.
- `make install-playground` copies the built font to
  `apps/playground/public/fonts/ChordProof.ttf` and `fonts/ChordProof.ttf`
  (npm publish path).
- `package.json` — `@chordlang/font` ships `fonts/ChordProof.ttf` + `NOTICE`.
- Python deps managed via `pyproject.toml` (fonttools, uharfbuzz, cu2qu).

### `packages/cli` — command-line tool

`chordlang <ast|canonical|html> file.cfmd` — three modes, each piping
through the same parse → normalize → render pipeline.

### `examples/` — source examples

- `font/*.txt` — ASCII symbol strips for README font preview.
- `charts/*.cfmd` — lead-sheet chart sources (playground + README previews).
- `graphs/*.cfgv` — Graphviz DOT harmonic graphs (standard DOT + ChordFont labels).
- `manifest.json` — playground chip order; `readme` key names files embedded in root README.

### `docs/assets/` — published previews

PNG (and graph SVG) outputs from `make previews`, driven by `scripts/render-previews.ts`.
Committed for GitHub README embeds — GitHub does not run ChordFont or Graphviz at view time.

Re-run `make previews` and commit `docs/assets/` when any of these change:

- README source files (`manifest.readme`: font strip, `blues-in-f.cfmd`, `ii-v-i-chain.cfgv`)
- Any other chart/graph in `manifest.json`
- `packages/render/chart.css` or ChordFont (`make font`)
- Preview script styling (`scripts/render-previews.ts`)

See `docs/readme-previews.md` for the full checklist.

### `apps/playground` — live preview (Vite)

- `src/main.ts` — wires textarea input → parse → render → page, with
  example chips and tabbed views (Engraved / AST / Canonical).
- `src/style.css` — app chrome; imports `packages/render/chart.css` for the
  fake-book page and chart grid.
- Vite config aliases `@chordlang/*` to package source so edits hot-reload
  without rebuilding.

## Layout model (CSS)

The chart grid uses `display: grid; grid-template-columns: repeat(4, 1fr)`.
Section labels span full-width (`grid-column: 1 / -1`).  Barlines are CSS
borders: every bar gets `border-left`, row-ending bars (`.chordlang-bar-end`)
get `border-right`.  Rows are spaced with `row-gap`.

## Tests

`make test` runs vitest across packages:
- `packages/chord/src/normalize.test.ts` — normalization cases
- `packages/parser/src/parse.test.ts` — grammar/AST structure
- `packages/graph/src/graph.test.ts` — SVG styling helper
- `packages/render/src/render.test.ts` — HTML output assertions
