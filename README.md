# chordlang

A portable, text-authored, properly-engraved chord-changes format.
Superset of existing chord-chart conventions; the differentiator is the
rendering layer (a chord-symbol engraving font, not CSS superscripts).

## Quick start

```
make setup     # install (pnpm) + Playwright chromium
make dev       # live playground — type text, watch it engrave
make test      # vitest across packages
make previews  # regenerate docs/assets/ preview images (see below)
make help      # every target, self-documented
```

### README preview images

The engraved PNGs in the sections below are **not** rendered live on GitHub — they are
screenshots committed under `docs/assets/`. Regenerate and commit them whenever the
visual output would change:

| Re-run `make previews` after… | Why |
|-------------------------------|-----|
| Editing a README source file (`examples/font/readme-symbols.txt`, `examples/charts/blues-in-f.cfmd`, `examples/graphs/ii-v-i-chain.cfgv`) | Source text and PNG must stay in sync |
| Editing any other file listed in `examples/manifest.json` | All manifest charts/graphs get PNG (+ SVG for graphs) |
| Changing `packages/render/chart.css` | Chart layout and engraving styling |
| Rebuilding ChordFont (`make font`) | Ligatures / glyph shapes change |
| Editing `scripts/render-previews.ts` | Screenshot framing, font inlining, graph SVG styling |

Requires Node 22, Playwright chromium (`make setup`), and `apps/playground/public/fonts/ChordProof.ttf`.
If you change a README source file, update the matching code block in `README.md` too.
Full workflow: [`examples/README.md`](examples/README.md).

## ChordFont

An OpenType font that engraves single-line jazz chord symbols from plain ASCII
via GSUB ligatures — the shaping engine does the work, no JavaScript at render
time. Outlines derived from [Petaluma](https://github.com/steinbergmedia/petaluma)
(OFL). Build and spec: [`packages/font/`](packages/font/).

Source (`examples/font/readme-symbols.txt`):

```
Cmaj7 Dm7b5 F#m7 G13 Bb7
```

![ChordFont engraved symbols](docs/assets/font/readme-symbols.png)

## Charts

Lead-sheet chord changes in `.cfmd` — a Peggy grammar for structure, ChordFont
for symbols. Commas subdivide a bar into equal beat-slots; `%` repeats the
previous bar; `[A]` marks a form section. Grammar IS the spec:
[`packages/parse/src/chart.peggy`](packages/parse/src/chart.peggy).

Source (`examples/charts/blues-in-f.cfmd`):

```
{title: F Blues}
{key: F}
| F7 | Bb7 | F7 | Cm7,F7 |
| Bb7 | % | F7 | Am7b5,D7 |
| Gm7 | C7 | F7,D7 | Gm7,C7 |
```

![F Blues engraved chart](docs/assets/charts/blues-in-f.png)

More charts in [`examples/charts/`](examples/charts/) · live edit with `make dev`.

## Graphs

Harmonic progressions as standard [Graphviz DOT](https://graphviz.org/doc/info/lang.html)
in `.cfgv`. Node labels use `fontname="ChordFont"`; chordlang post-styles the SVG.

Source (`examples/graphs/ii-v-i-chain.cfgv`):

```
digraph {
  rankdir=LR;
  graph [bgcolor="transparent" pad=0.4];
  node [shape=plaintext fontname="ChordFont" fontsize=36];
  edge [color="#6f6a5e" penwidth=1.4 arrowsize=0.7];

  Am7 -> D7 -> Gmaj7 -> Cmaj7 -> "F#m7b5" -> B7 -> Em7;
}
```

![ii–V–I chain](docs/assets/graphs/ii-v-i-chain.png)

More graphs in [`examples/graphs/`](examples/graphs/) · HTML gallery with `make graphs`.

## Layout

```
examples/           .cfmd / .cfgv / .txt sources + manifest
docs/assets/        committed preview PNGs (make previews)
packages/chord      normalize(symbol) → canonical struct
packages/parse      Peggy chart grammar → AST (grammar IS the spec)
packages/render     AST + chart.css → engraved HTML
packages/font       ChordFont OpenType build (Python)
packages/cli        chordlang <ast|canonical|html> file.cfmd
apps/playground     live preview (src-aliased packages)
tools/corpus        stub: McGill/Weimar frequency mining (future)
```
