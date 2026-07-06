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

**Docker (recommended):** For byte-for-byte identical previews matching CI.

**Alternative:** Node 22 (`.nvmrc`), Playwright chromium (`make setup`), and
`apps/playground/public/fonts/ChordProof.ttf`. Note: Local rendering may differ
slightly from CI due to environment differences.

## Platform consistency via Docker

**Canonical environment:** Docker container with pinned `node:22.14.0-bookworm`  
**Why:** Font rendering differs across platforms and even Linux distributions.
Docker ensures byte-for-byte identical PNGs by:
- Pinning base image (`node:22.14.0-bookworm`)
- Pinning system libraries (Chromium dependencies)
- Pinning Playwright/Chromium versions (from `pnpm-lock.yaml`)
- Normalizing PNG output with `optipng` (strips metadata, deterministic compression)

### Generating previews locally

**Recommended (Docker):**
```bash
./scripts/docker-previews.sh
```

This builds a Docker image with the exact environment used in CI and generates
previews. Changes appear in `docs/assets/` and can be committed directly.

**Alternative (native):**
```bash
make previews
```

Works but may produce different pixels than CI. Use Docker before committing to
ensure CI will pass.

### CI checks

1. **`preview-drift`** (Docker on `ubuntu-latest`) — Fail if committed
   `docs/assets/` don't match regenerated output. This catches "forgot to run
   `make previews`" mistakes.

2. **`preview-cross-platform`** (macOS, Windows, native Node) — Regenerate
   previews and report differences. This catches platform-specific rendering
   bugs while allowing expected antialiasing differences. Currently
   informational; future work will add image comparison with tolerance
   thresholds.

## Checklist after editing a README example

1. Edit the source under [`examples/`](../examples/).
2. `make previews`
3. Update the matching fenced code block in root `README.md` if the source text changed.
4. Commit source + `docs/assets/` together.

See [`examples/README.md`](../examples/README.md) for editing `.cfmd` / `.cfgv` sources.
