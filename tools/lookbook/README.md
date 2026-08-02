# ChordFont look book

Side-by-side **reference** (printed crops, LilyPond/LilyJAZZ engravings, Petaluma
glyph specimens) vs **live ChordFont** shaping of the canonical ASCII.

Pair with the exhaustive render-only atlas (`make font-atlas`). HarfBuzz tests
(`packages/font/tests/shape_test.py`) remain the CI shaping spec.

## Quick start

```bash
make lookbook          # builds font + tools/lookbook/lookbook.html
open tools/lookbook/lookbook.html
```

Requires Node 22 (`.nvmrc`) and a built ChordProof.ttf (`make font`).

## Feedback loop

1. Open `lookbook.html` (offline; font is inlined, images under `refs/`).
2. Filter by family / method; work each card’s **observe** checklist.
3. Tweak `packages/font/glyphs/source_map.json` (`scale`/`dx`/`dy`) or GSUB in
   `packages/font/src/build_font.py`.
4. `make lookbook` again (or `make font-atlas` for the full matrix).

## Layout

| Path | Role |
|------|------|
| `entries.json` | Unified corpus (`method`, `shape_ascii`, provenance) |
| `sources.json` | Source licenses + `wanted_next` targets |
| `refs/*.png` | Reference crops / engravings |
| `lookbook.html` | Generated UI (gitignored — run `make lookbook`) |
| `render-lookbook.ts` | HTML builder (inlines ChordProof.ttf) |
| `merge_corpora.py` | Import agent drops from `harvested/` + `rendered/` |
| `GAP_REPORT.md` | P0 symbols still thin in real print |
| `harvest_openbook.py` / `render_specimens.py` | Optional re-harvest tooling |

**Methods** on each entry:

- `crop` — OpenBook / in-context lead-sheet crops
- `tool-engraving` — LilyPond classical / spelled / LilyJAZZ
- `glyph-specimen` — Petaluma Script / SMuFL raw glyphs (DNA, not layout)
- `external` — hotlinked charts / docs

Entries with a valid `shape_ascii` render live in the **ours** column; glyph-only
specimens show “not a ChordFont input”.

## Importing a new corpus zip

```bash
mkdir -p tools/lookbook/harvested tools/lookbook/rendered
# unpack agent deliverables into those dirs
python3 tools/lookbook/merge_corpora.py
make lookbook
```

## Copyright

Prefer OFL / GPL / GFDL / CC sources. Copyrighted lead sheets: minimal
single-symbol crops only, recorded as fair-use educational crops with citation.
Never commit full pages or playable systems. See `sources.json`.
