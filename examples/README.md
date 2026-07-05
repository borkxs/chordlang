# Examples

Source-of-truth examples for the playground, CLI, and README previews.

## Formats

| Extension | Name | Spec |
|-----------|------|------|
| `.txt` | font symbol strip | Plain ASCII chord tokens — README font preview only |
| `.cfmd` | chord font markdown | `packages/parse/src/chart.peggy` — lead-sheet chart structure |
| `.cfgv` | chord font graphviz | Standard [Graphviz DOT](https://graphviz.org/doc/info/lang.html); node labels use `fontname="ChordFont"` |

`manifest.json` has two roles:

- **`readme`** — which files the root README embeds (source text + PNG must match).
- **`charts` / `graphs`** — playground chip order and full preview output list.

## Edit workflow

1. Edit a file under `font/`, `charts/`, or `graphs/`.
2. `make dev` — playground loads chart/graph examples via Vite glob (live, no screenshot).
3. If the visual output changed, `make previews` — regenerate `docs/assets/` and commit the PNGs.
   See [`docs/readme-previews.md`](../docs/readme-previews.md) for the full checklist.

Each manifest `file` slug is a playground route:

- Charts: `/chart/walkin-thing`, `/chart/giant-steps`, …
- Graphs: `/graph/ii-v-i-chain`, `/graph/giant-steps`, …

When a slug exists in both lists (e.g. `giant-steps`), the nav shows a **chart →** / **graph →** link to the matching peer.

Graph DOT is passed straight to Graphviz; chordlang only post-styles the SVG
(ChordFont on `<text>`). Charts go through parse → normalize → render → screenshot.
