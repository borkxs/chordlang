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
| Slash + bass collided / PDF extract blob (`C△7Æ`) | `slash`: roomier advance (560) + padding (`dx` 55); bass stays full root size (ADR-009) |
| Ours column too small vs reference crops | Look book CSS: `3.25rem` symbol size, taller cells |
| “Non-deterministic” parens in ours column | Not GSUB — lookbook `shape_ascii` had leaked LilyJAZZ parens. Reverted to inline; ADR-008 + shape tests for both branches |
| Variant spellings (dim/maj7/dash-minor) | v1 = Real Book house style; publisher presets planned as `ss01`–`ss04` (ADR-010) — not implemented yet |
| Broken / missing refs | Tagged `review_status: needs-fix` (Clyd `#11` refs, incontext image-missing, bad OpenBook crops). Release gate = zero P0 needs-fix / confirm-label / image-missing |

## Follow-up pass (same PR)

1. **ø half-diminished** — `hdim.slash` from Petaluma `csymHalfDiminished`; type
   Unicode `ø` / `Bø7`. Spelled `Bm7b5` unchanged. Do not use ASCII `o`.
2. **Linear parentheses** — PetalumaScript `(` / `)`; typed `G7(b9)` etc. shape
   in 1D. Canonical Real Book is **inline** (`G7b9`) — parens are opt-in only
   (ADR-008). Vertical multi-tier stacks remain WALL.
3. **Stroke weight** — extract emboldens via `skia-pathops` (`DEFAULT_EMBOLDEN=16`).
   Not a full LilyJAZZ redraw (ADR-005), but closes the lookbook weight gap.
4. **Review status UI** — `review_status` / `review_note` on entries + filter chips
   + release-gate banner in `lookbook.html`.

## Measure repeat (`%`)

Chart cells use `%` for “same as previous bar” (iReal / Real Book). Look book had
no printed crop; wired Petaluma SMuFL `repeat1Bar` (slash + dots) to `%` as
`repeat.bar` — not PetalumaScript’s percent sign. Specimen: `pm-repeat1bar`.

## Decisions locked this round

| Topic | ADR | Lookbook / tests |
|-------|-----|------------------|
| Parens = typed opt-in only | ADR-008 | `paren-g7b9`, `paren-c7sharp11`, `paren-bm7b5` + shape tests |
| Slash = one `source_map` knob, roomy | ADR-009 | `slash` `dx:180` / `advance:640` |
| Real Book: baseline primary extensions | ADR-011 | `A13b9` → `d1 d3` + `d9.sup` (not all-sup) |

## Still open

1. Printed △ / ø / dash-minor / `%` crops — see `GAP_REPORT.md` / `sources.json → wanted_next`.
2. True outline redraw for a sellable face (ADR-005).
3. Tall SMuFL paren glyphs for stacked towers (WALL → SVG).
4. Regenerate `cmaj7sharp11--*` refs (currently render as “Clyd” — failed Lily markup).
5. Localize missing incontext / external refs; re-crop bad OpenBook windows
   (`ob-am7-p67`, `ob-ab9`, `ob-e7s5-p103`, `ob-g7s5b9`, `ob-g7b9`).
6. Implement ADR-010 stylistic sets (`ss01`–`ss04`) — documented, not coded.
7. Drive P0 `review_status` to all-`accepted` for the release gate.
8. Freeze the 139+ shape strings as a diffenator2 wordlist once the banner flips.

## Loop

```bash
# edit source_map.json → rebuild → compare
make lookbook
make lookbook-pdf   # waits for ChordFont + images; do not bare-goto PDF
node --experimental-strip-types tools/lookbook/capture-comparisons.ts
make -C packages/font test
```
