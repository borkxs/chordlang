# Gap report — P0 references still wanted

## Covered well
Bare accidental roots (Bb/F#/Eb: ob + ps), plain dominants (D7/G7/F7), m7b5 spelled out
(3 instances), dim spelled out, 7b9 / 7#9 / 7#5 / 7b5, maj7 spelled out, sus4, slash bass
(7 instances incl. Dm7/G, accidental basses Fm7/Bb & Cm6/Eb, and root-accidental Ab9/C),
C6, 9ths, a G7#5b9 double alteration, one wall-tier B7(b5b9b11b13), and canonical
Petaluma △ ø ° + − glyph shapes.

## Missing or thin — humans should photograph/scan these next
1. **Triangle maj7 in context** (`C△` / `△7` on a printed chart). We have the raw Petaluma
   triangle glyph (pm-csym-maj7-triangle) but no *composed* `C△7` from a real page —
   OpenBook's house style spells `maj7`. Best sources: a Real Book page photo, or a Dorico
   render (free SE tier) using Petaluma — that is also the single best reference for how
   Steinberg composes these exact glyphs (superscript scale, accidental raise).
2. **ø half-diminished in context** (`Bø7`). Same situation: glyph yes, composed symbol no.
3. **Real Book dash-minor** (`C-7`). pm-csym-minor gives the dash glyph; need a printed page.
4. **7#11 / 7b13 / 7alt in print.** OpenBook's vocabulary (155 tunes) prints b5/#5 instead
   of #11/b13, and never prints "alt". ps-* specimens cover the strings; a printed source
   (New Real Book preview pages, Aebersold-style charts) is wanted.
5. **13 chords and 13b9 in print.** Angel Eyes' `:13` chord exists in source but wasn't
   isolated with confidence; ps-f13/ps-13b9 cover strings only. Re-harvest p22 or find
   Easy To Love / Epistrophy pages in the OpenBook PDF.
6. **9sus4 in print** (only Dsus4 captured).
7. **Parenthesized tension towers** `G7(#11)(b13)` — wall-tier; note-only for now
   (font_scope: "wall"). The ob-b7-full-alt monster shows the *linear* extreme.
8. **Measure-repeat `%` in print.** Font now maps `%` → Petaluma `repeat1Bar`
   (`pm-repeat1bar` specimen). Still want a Real Book / OpenBook crop of the
   slash-with-dots in a bar cell next to surrounding chords.
9. **Cross-publisher diversity.** All engraved crops are one house style (LilyPond
   Ignatzek). Wanted: Hal Leonard Real Book 6th, New Real Book (Sher), older bootleg Real
   Book, MuseJazz (MuseScore), and a European house (e.g. Advance Music) for the same
   harmonies. Each is 10 minutes with a phone camera + a library copy.

## Sandbox constraints that shaped v1
Built in an environment whose network reaches package registries/GitHub only, so
web-hosted references (Wikimedia, IMSLP, publisher previews) could not be downloaded —
`sources.json → wanted_next` lists the exact targets and why; `fetch-remote.sh` localizes
the one hotlinked GFDL chart.

## Companion look book (merged)

Corpus + UI live at `tools/lookbook/` with `method`, `shape_ascii`, and
`review_status` fields. Release gate: every P0 `accepted`, zero confirm-labels,
zero image-missing (see lookbook README).

### Known broken / missing references (tagged `needs-fix`)

| Issue | Entries |
|-------|---------|
| LilyPond/LilyJAZZ markup failed → renders “Clyd” | `cmaj7sharp11--lilyjazz`, `--lilypond-classical`, `--lilypond-spelled` — regenerate (no in-repo Lily renderer; use external corpus + `merge_corpora.py`) |
| image-missing local PNG | five `incontext-*` All-of-Me crops; `lp-chord-name-chart`; `ext-halfdim-variants`; `ext-dorico-presets`; `ext-symbol-survey` |
| Wrong crop window | `ob-am7-p67` (Allegro), `ob-ab9` (rehearsal letter), `ob-e7s5-p103` (wrong system), `ob-g7s5b9` / `ob-g7b9` (bare G7) |

### House-style axes (not gaps in the font)

LilyJAZZ parenthesizes some alterations; ChordFont Real Book does not
(ADR-008). Spelled `maj7` / `dim` / dash-minor vs △ / ° / `m` are v1 house-style
choices with planned stylistic-set presets (ADR-010), not shaping bugs.
