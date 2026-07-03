# Architecture Decision Records

## ADR-001: License hygiene — conventions in, code out
We re-implement the chart grammar to spec and import NO code from QuickChords,
iReal Pro, markdown-it-chords, or ChordPro. Conventions borrowed as design
references (not copyrightable): comma bar-subdivision (QuickChords/iReal),
`{key: value}` directives (ChordPro), `%` bar-repeat and `[A]` section markers
(iReal). Licenses actually taken on: tonal (MIT), chordfont (OFL — see the
chordfont repo's ADR-005 for the Petaluma derivation).

## ADR-002: Wrap tonal; never write a chord-symbol parser
@tonaljs (via the `tonal` facade) parses symbols. @chordlang/chord is a thin
pre-fold (dialect variants: Δ/^/−/ø/°) + post-fold (canonical struct) that
fixes tonal's two known gaps: `7alt` voicing fabrication (we flag
`underspecified` instead) and half-diminished naming (ø7 ≡ m7b5 by factors).

## ADR-003: The Peggy grammar IS the format spec
packages/parse/src/chart.peggy is the source of truth. It parses STRUCTURE
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
