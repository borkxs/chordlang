# chordlang

A portable, text-authored, properly-engraved chord-changes format.
Superset of existing chord-chart conventions; the differentiator is the
rendering layer (a chord-symbol engraving font, not CSS superscripts).

## Quick start

```
make setup     # install (pnpm) + Playwright chromium
make dev       # live playground — type text, watch it engrave
make test      # vitest across packages
make previews  # regenerate docs/assets/ preview images
make help      # every target, self-documented
```

## Examples

Source files live in [`examples/`](examples/) — `.cfmd` charts and `.cfgv` graphs.

**Chart** (`examples/charts/blues-in-f.cfmd`):

![F Blues engraved chart](docs/assets/charts/blues-in-f.png)

**Graph** (`examples/graphs/ii-v-i-chain.cfgv` — standard Graphviz DOT, ChordFont labels):

![ii–V–I chain](docs/assets/graphs/ii-v-i-chain.png)

More: [`examples/README.md`](examples/README.md) · [`make graphs`](Makefile) for an HTML gallery.

## Layout

```
examples/           .cfmd / .cfgv sources + manifest
docs/assets/        committed preview PNGs (make previews)
packages/chord      normalize(symbol) → canonical struct
packages/parse      Peggy chart grammar → AST (grammar IS the spec)
packages/render     AST + chart.css → engraved HTML
packages/font       ChordFont OpenType build (Python)
packages/cli        chordlang <ast|canonical|html> file.cfmd
apps/playground     live preview (src-aliased packages)
tools/corpus        stub: McGill/Weimar frequency mining (future)
```

## Format at a glance

```
{title: F Blues}
{key: F}
| F7 | Bb7 | F7 | Cm7,F7 |
| Bb7 | % | F7 | Am7b5,D7 |
```

Commas subdivide a bar into equal beat-slots. `%` repeats the previous bar.
`[A]` marks a form section. Chord symbols accept the common jazz dialect
(Δ ^ − ø ° alt …) and normalize to one canonical form.

Font: the playground ships a snapshot of chordfont's proof build (OFL,
outlines derived from Petaluma — see `apps/playground/public/fonts/`).
