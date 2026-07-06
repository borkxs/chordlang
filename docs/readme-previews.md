# README preview images

The engraved PNGs embedded in the root [README](../README.md) are **not** rendered
live on GitHub — they are screenshots committed under `docs/assets/`. Regenerate
and commit them whenever the visual output would change.

## Pipeline

`make previews` runs [`scripts/render-previews.ts`](../scripts/render-previews.ts):

```
examples/font/readme-symbols.txt  →  docs/assets/font/readme-symbols.png
examples/charts/*.cfmd            →  docs/assets/charts/*.png
examples/graphs/*.cfgv            →  docs/assets/graphs/*.png (+ .svg)
```

Charts: parse → normalize → HTML + `chart.css` → Playwright screenshot (ChordFont
inlined as base64).

Graphs: Graphviz DOT → SVG (font embedded) → Playwright screenshot for PNG.

Which files the README embeds is listed under `readme` in
[`examples/manifest.json`](../examples/manifest.json).

## When to re-run `make previews`

| Re-run after… | Why |
|---------------|-----|
| Editing a README source file (`examples/font/readme-symbols.txt`, `examples/charts/blues-in-f.cfmd`, `examples/graphs/ii-v-i-chain.cfgv`) | Source text and PNG must stay in sync |
| Editing any other file listed in `examples/manifest.json` | All manifest charts/graphs get PNG (+ SVG for graphs) |
| Changing `packages/render/chart.css` | Chart layout and engraving styling |
| Rebuilding ChordFont (`make font`) | Ligatures / glyph shapes change |
| Editing `scripts/render-previews.ts` | Screenshot framing, font inlining, graph SVG styling |
| Changing `manifest.json` `readme` keys | Point script at new sources; update README embeds |

## Prerequisites

Node 22 (`.nvmrc`), Playwright chromium (`make setup`), and
`apps/playground/public/fonts/ChordProof.ttf`.

**Platform note:** The CI preview-drift check runs on `ubuntu-latest` to match
typical development environments. Font rendering differs between platforms
(Linux/macOS/Windows), so previews should ideally be regenerated on Linux to
avoid false drift detection. If you regenerate on a different platform and the
CI fails, the images are likely functionally identical but with minor
antialiasing differences.

## Checklist after editing a README example

1. Edit the source under [`examples/`](../examples/).
2. `make previews`
3. Update the matching fenced code block in root `README.md` if the source text changed.
4. Commit source + `docs/assets/` together.

See [`examples/README.md`](../examples/README.md) for editing `.cfmd` / `.cfgv` sources.
