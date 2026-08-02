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

Requires **Node 22+** (`.nvmrc` — `nvm use`) and built style TTFs (`make font`).
Defaults to **Real Book** (`ChordFont-Real Book.ttf`); use `--style pop` for Pop.
Older Node fails with `bad option: --experimental-strip-types`.

## Release gate (mechanical)

Each entry carries `review_status` (`unreviewed` | `accepted` | `needs-fix`) and
optional `review_note`. The lookbook UI exposes review filter chips next to
family/method, plus a **release-gate** banner:

**Releasable** ⇔ every P0 entry is `accepted`, zero P0 `confirm-label`, zero
P0 `image-missing` notes.

Do not mark cards `accepted` while the reference is broken (e.g. LilyPond
“Clyd”), missing, or a wrong crop — keep `needs-fix` until regenerated.

**Ours column rule (ADR-008):** `shape_ascii` is always canonical ChordFont
input — inline alterations (`G7b9`, not `G7(b9)`). Parentheses in the
reference are a house-style difference, not something “ours” should mimic
unless the user typed them.

## Feedback loop

1. Open `lookbook.html` (offline; font is inlined, images under `refs/`).
2. Filter by family / method / **review status**; work each card’s **observe** checklist.
3. Tweak `packages/font/glyphs/source_map.json` (`scale`/`dx`/`dy`) or GSUB in
   `packages/font/src/build_font.py` / `styles/*/features.fea`.
4. `make lookbook` again (or `make font-atlas` for the full matrix).
5. When a card’s ours+reference are correct, set `review_status: accepted` in
   `entries.json` (or leave `needs-fix` + note).

```bash
# Pop style look book
node --experimental-strip-types tools/lookbook/render-lookbook.ts --style pop

# Headless card captures for agent / PR review (writes captures/, gitignored)
node --experimental-strip-types tools/lookbook/capture-comparisons.ts
```

See [`ITERATION_NOTES.md`](ITERATION_NOTES.md) for the latest tuning pass and what
not to overfit when comparing house styles.

## Layout

| Path | Role |
|------|------|
| `entries.json` | Unified corpus (`method`, `shape_ascii`, `review_status`, provenance) |
| `sources.json` | Source licenses + `wanted_next` targets |
| `refs/*.png` | Reference crops / engravings |
| `lookbook.html` | Generated UI (gitignored — run `make lookbook`) |
| `render-lookbook.ts` | HTML builder (inlines ChordFont style TTF) |
| `capture-comparisons.ts` | Headless card screenshots → `captures/` |
| `ITERATION_NOTES.md` | Latest glyph-tuning findings from comparisons |
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
