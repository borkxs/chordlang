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

## README preview pipeline

GitHub renders the root README from committed PNGs, not from live ChordFont/Graphviz.
`make previews` runs `scripts/render-previews.ts`:

```
examples/font/readme-symbols.txt  →  docs/assets/font/readme-symbols.png
examples/charts/*.cfmd          →  docs/assets/charts/*.png
examples/graphs/*.cfgv            →  docs/assets/graphs/*.png (+ .svg)
```

Charts: parse → normalize → HTML + `chart.css` → Playwright screenshot (ChordFont inlined as base64).
Graphs: Graphviz DOT → SVG (font embedded) → Playwright screenshot for PNG.

### When to re-run `make previews`

| Trigger | Affected outputs |
|---------|------------------|
| `examples/font/readme-symbols.txt` | `docs/assets/font/readme-symbols.png` + README code block |
| `examples/charts/blues-in-f.cfmd` | `docs/assets/charts/blues-in-f.png` + README code block |
| `examples/graphs/ii-v-i-chain.cfgv` | `docs/assets/graphs/ii-v-i-chain.png` + README code block |
| Any other file in `manifest.json` `charts` / `graphs` | Matching file under `docs/assets/` |
| `manifest.json` `readme` keys | Point script at new sources; update README embeds |
| `packages/render/chart.css` | All chart PNGs |
| ChordFont rebuild (`make font` → playground TTF) | All PNGs (font strip, charts, graphs) |
| `scripts/render-previews.ts` | Whatever that script renders |

**Prerequisites:** Node 22 (`.nvmrc`), `make setup` (Playwright chromium), ChordProof.ttf present.

**Checklist after editing a README example:**

1. Edit the source under `examples/`.
2. `make previews`
3. Update the matching fenced code block in root `README.md` if the source text changed.
4. Commit source + `docs/assets/` together.

Graph DOT is passed straight to Graphviz; chordlang only post-styles the SVG
(ChordFont on `<text>`). Charts go through parse → normalize → render → screenshot.
