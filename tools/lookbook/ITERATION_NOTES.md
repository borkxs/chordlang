# Look book → font iteration notes

Working notes from comparing `make lookbook` cards against ChordFont Real Book
and tuning `packages/font/glyphs/source_map.json`.

## What the look book is for

- **Use for layout / glyph DNA:** Petaluma specimens (`ps-*`, `pm-*`), OpenBook
  crops (`ob-*`) for printed proportions, LilyJAZZ for Real Book–adjacent rhythm.
- **Do not chase blindly:** LilyJAZZ house style differs from our Real Book
  conventions (parentheses around alterations, `M7` vs △, stacked m/7). Stroke
  weight also differs — ChordFont uses Petaluma outlines; LilyJAZZ is a heavier
  marker face. Matching weight requires outline redraw (ADR-005), not `scale`/`dy`.

## Findings → changes (this pass)

| Observation | Change |
|-------------|--------|
| Root ♭/♯ read as superscripts (too high, too small vs `ps-bb-root` / triads) | `flat.root` / `sharp.root`: larger scale, much lower `dy`, wider advance |
| △ / ○ quality markers floated high and felt light vs letter height | `maj.tri` / `dim.ring`: slightly larger, lower |
| Alteration accidentals slightly light vs `.sup` digits | `flat.alt` / `sharp.alt`: scale/dy aligned to superscript band (~325–700) |
| Slash bass felt gappy (`Dm7/G`) | `slash`: tighter scale + smaller advance |
| Ours column too small vs reference crops | Look book CSS: `3.25rem` symbol size, taller cells |

## Follow-up pass (same PR)

1. **ø half-diminished** — `hdim.slash` from Petaluma `csymHalfDiminished`; type
   Unicode `ø` / `Bø7`. Spelled `Bm7b5` unchanged. Do not use ASCII `o`.
2. **Linear parentheses** — PetalumaScript `(` / `)`; `G7(b9)`, `C7(#11)`,
   `Bm7(b5)` shape in 1D. Vertical multi-tier stacks remain WALL.
3. **Stroke weight** — extract emboldens via `skia-pathops` (`DEFAULT_EMBOLDEN=16`).
   Not a full LilyJAZZ redraw (ADR-005), but closes the lookbook weight gap.

## Still open

1. Printed △ / ø / dash-minor crops — see `GAP_REPORT.md` / `sources.json → wanted_next`.
2. True outline redraw for a sellable face (ADR-005).
3. Tall SMuFL paren glyphs for stacked towers (WALL → SVG).

## Loop

```bash
# edit source_map.json → rebuild → compare
make lookbook
node --experimental-strip-types tools/lookbook/capture-comparisons.ts
make -C packages/font test
```
