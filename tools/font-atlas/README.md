# ChordFont atlas — visual feedback loop

Headless tool that renders **every supported ASCII chord symbol × every root
spelling** through ChordFont and writes a proof sheet you (or an agent) can
inspect or diff after font changes.

Use this when iterating on glyph outlines, GSUB rules, or ligature behavior —
not for chart/HTML rendering (see `make previews` and `make dev` for that).

## Quick start

From the repo root (Node 22 per `.nvmrc`, Playwright chromium from `make setup`):

```bash
make font-atlas
```

Outputs (gitignored under `packages/font/dist/`):

| File | Purpose |
|------|---------|
| `atlas.png` | Full-page screenshot — primary visual regression surface |
| `atlas.html` | Same grid, open in a browser for zoom/inspect |
| `atlas-symbols.json` | Machine-readable symbol list + grouping metadata |

## Feedback loop (humans and agents)

```
1. Edit font sources
      glyphs/source_map.json   — outline scale/dx/dy per glyph
      src/build_font.py        — GSUB feature rules (liga/calt)
      tests/shape_test.py      — expected HarfBuzz glyph streams (required for new features)

2. Rebuild + regenerate proof
      make font-atlas          — runs `make font`, then renders atlas

3. Evaluate
      • Open atlas.png (or diff against a saved baseline)
      • Read atlas-symbols.json for the full symbol manifest
      • Run `make -C packages/font test` — shaping assertions must stay green

4. Extend coverage (when adding symbol types)
      • Add suffix patterns to catalog.ts (SYMBOL_GROUPS)
      • Add matching CASES in packages/font/tests/shape_test.py
      • Re-run make font-atlas
```

**Do not commit** `packages/font/dist/atlas.*` — they are local build artifacts.
Commit source changes (`catalog.ts`, font Python, `shape_test.py`) only.

## What gets rendered

`catalog.ts` defines:

- **17 root spellings** — `C` through `B`, including enharmonic pairs (`C#`/`Db`, …) so `sharp.root` and `flat.root` ligatures are both exercised
- **7 suffix groups** — triads, sevenths, sixths, extensions, dominant alterations, sus/add dominants, slash bass patterns

Every cell shows the engraved symbol (ChordFont with `liga` + `calt`) and a
monospace label underneath.

## CLI options

```bash
pnpm font-atlas

node --experimental-strip-types tools/font-atlas/render-atlas.ts \
  --font packages/font/dist/ChordProof.ttf \
  --out /tmp/atlas

node --experimental-strip-types tools/font-atlas/render-atlas.ts --html-only
node --experimental-strip-types tools/font-atlas/render-atlas.ts --png-only
```

From `packages/font/`, `make atlas` delegates to the repo-root script (after
`make build` in that package).

## Related tools

| Tool | When to use |
|------|-------------|
| `make -C packages/font proof` | Small curated set + HarfBuzz metrics table (`dist/proof.html`) |
| `make -C packages/font test` | CI shaping spec — must pass on every font change |
| `make previews` | README chart/graph PNGs — different pipeline, not symbol exhaustive |
| `make dev` | Interactive playground for spot-checking individual symbols |

## Source files

```
tools/font-atlas/
  README.md         ← you are here
  catalog.ts        ← symbol matrix (roots × suffix groups)
  render-atlas.ts   ← HTML + PNG + JSON renderer (Playwright)
```
