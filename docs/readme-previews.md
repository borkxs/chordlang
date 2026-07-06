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

## Platform consistency

**Canonical platform:** Linux (`ubuntu-latest`)  
**Why:** Font rendering differs across platforms (antialiasing, hinting). We pick
one as the source of truth.

The CI runs two checks:

1. **`preview-drift`** (Ubuntu) — Fail if committed `docs/assets/` don't match
   regenerated output. This catches "forgot to run `make previews`" mistakes.

2. **`preview-cross-platform`** (macOS, Windows) — Regenerate previews and
   report differences. This catches platform-specific rendering bugs while
   allowing expected antialiasing differences. Currently informational; future
   work will add image comparison with tolerance thresholds.

**When regenerating previews locally:** Run on Linux if possible (Docker, WSL, or
native Linux). If you regenerate on macOS/Windows, the `preview-drift` CI will
fail due to platform differences, but your visual changes are still valid — just
regenerate on Linux before merging.

## Checklist after editing a README example

1. Edit the source under [`examples/`](../examples/).
2. `make previews`
3. Update the matching fenced code block in root `README.md` if the source text changed.
4. Commit source + `docs/assets/` together.

See [`examples/README.md`](../examples/README.md) for editing `.cfmd` / `.cfgv` sources.
