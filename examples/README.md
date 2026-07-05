# Examples

Source-of-truth examples for the playground, CLI, and README previews.

## Formats

| Extension | Name | Spec |
|-----------|------|------|
| `.cfmd` | chord font markdown | `packages/parse/src/chart.peggy` — lead-sheet chart structure |
| `.cfgv` | chord font graphviz | Standard [Graphviz DOT](https://graphviz.org/doc/info/lang.html); node labels use `fontname="ChordFont"` |

`manifest.json` lists files in chip order (playground labels + preview output names).

## Edit workflow

1. Edit a file under `charts/` or `graphs/`.
2. `make dev` — playground loads examples via Vite glob.
3. `make previews` — regenerate PNG/SVG under `docs/assets/` for README embeds.

Graph DOT is passed straight to Graphviz; chordlang only post-styles the SVG
(ChordFont on `<text>`). Charts go through parse → normalize → render → screenshot.
