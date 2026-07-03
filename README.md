# chordlang

A portable, text-authored, properly-engraved chord-changes format.
Superset of existing chord-chart conventions; the differentiator is the
rendering layer (a chord-symbol engraving font, not CSS superscripts).

## Quick start
    make setup     # install (pnpm)
    make dev       # live playground — type text, watch it engrave
    make test      # vitest across packages
    make help      # every target, self-documented

## Layout
- `packages/chord`  — normalize(symbol) → canonical struct (wraps tonal)
- `packages/parse`  — Peggy chart grammar → AST (the grammar file IS the spec)
- `packages/render` — AST + font → engraved HTML chart
- `packages/cli`    — `chordlang <ast|canonical|html> file.chart`
- `apps/playground` — live preview of the CURRENT lib code (src-aliased)
- `tools/corpus`    — stub: McGill/Weimar frequency mining (future)

## Format at a glance
    {title: F Blues}
    {key: F}
    [A]
    | F7 | Bb7 | F7 | Cm7,F7 |
    | Bb7 | % | F7 | Am7b5,D7 |

Commas subdivide a bar into equal beat-slots. `%` repeats the previous bar.
`[A]` marks a form section. Chord symbols accept the common jazz dialect
(Δ ^ − ø ° alt …) and normalize to one canonical form.

Font: the playground ships a snapshot of chordfont's proof build (OFL,
outlines derived from Petaluma — see public/fonts/OFL-NOTE.txt).
