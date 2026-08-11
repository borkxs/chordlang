# Architecture Decision Records

## ADR-001: License hygiene — conventions in, code out
We re-implement the chart grammar to spec and import NO code from QuickChords,
iReal Pro, markdown-it-chords, or ChordPro. Conventions borrowed as design
references (not copyrightable): comma bar-subdivision (QuickChords/iReal),
`{key: value}` directives (ChordPro), `%` / `:/:` bar-repeat and `[A]` section
markers (iReal / lead-sheet ASCII). Licenses actually taken on: tonal (MIT),
chordfont (OFL — see the chordfont repo's ADR-005 for the Petaluma derivation).

## ADR-002: Wrap tonal; never write a chord-symbol parser
@tonaljs (via the `tonal` facade) parses symbols. @chordlang/chord is a thin
pre-fold (dialect variants: Δ/^/−/ø/°) + post-fold (canonical struct) that
fixes tonal's two known gaps: `7alt` voicing fabrication (we flag
`underspecified` instead) and half-diminished naming (ø7 ≡ m7b5 by factors).

## ADR-003: The Peggy grammar IS the format spec
packages/parser/src/chart.peggy is the source of truth. It parses STRUCTURE
only; chord tokens are opaque strings handed to @chordlang/chord. Declarative,
executable, and diffable — the properties a portable format spec needs.

## ADR-004: Playground aliases src/, not dist/
Vite aliases point at package sources so edits hot-reload with no rebuild.
Tradeoff accepted: the playground previews TS source, not the published build.

## ADR-005: Rendering split — chart layout is ours, symbol engraving is the font's
@chordlang/render emits each chord's ASCII form inside a ChordFont-styled span
with liga+calt on; the font's GSUB does the symbol engraving. Render owns only
the measure grid / sections / beat cells. No layout tokens in the source format
(the iReal anti-pattern).

ChordFont does not tokenize chord symbols at render time; it relies on
deterministic OpenType contextual substitution for visual accidental binding.
Semantic parsing (`@chordlang/chord`) may reject or normalize symbols, but glyph
binding is specified by GSUB shape tests (`packages/font/tests/shape_test.py`).

**GSUB is the engraving spec; the normalizer is the harmony spec.** The font
API is ASCII → glyphs; the chord API is messy input → canonical ASCII + meaning.

## ADR-006: v0.1 publish scope and package names
**Scope:** ship the parse → normalize → render pipeline plus graph renderer and
font tarball. Harmonic analyzer (`@chordlang/analyze`) and corpus tooling stay
out of v0.1.

**Names (v0.1):**
- `@chordlang/parser` — `packages/parser` (renamed from `parse` before npm publish).
- `@chordlang/chord` — publish as its own package; render depends on it. Do not fold into parser/analyze yet.
- `@chordlang/render`, `@chordlang/cli` — unchanged.
- `@chordlang/graph` — `packages/graph`; Graphviz DOT → styled SVG (extracted from playground).
- `@chordlang/font` — `packages/font` npm tarball with `ChordProof.ttf` + OFL notice; Python build unchanged.

**Build contract:** published tarballs ship `dist/` only (`files` + `exports`); playground keeps Vite src aliases (ADR-004). All six packages are public on npm under `@chordlang` (org registered; first release `v0.1.0`, current `v0.1.1`). Publish via `.github/workflows/publish.yml` on version tags.
