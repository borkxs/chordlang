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
8. **Cross-publisher diversity.** All engraved crops are one house style (LilyPond
   Ignatzek). Wanted: Hal Leonard Real Book 6th, New Real Book (Sher), older bootleg Real
   Book, MuseJazz (MuseScore), and a European house (e.g. Advance Music) for the same
   harmonies. Each is 10 minutes with a phone camera + a library copy.

## Sandbox constraints that shaped v1
Built in an environment whose network reaches package registries/GitHub only, so
web-hosted references (Wikimedia, IMSLP, publisher previews) could not be downloaded —
`sources.json → wanted_next` lists the exact targets and why; `fetch-remote.sh` localizes
the one hotlinked GFDL chart.

## Companion look book (parallel session)
A second look book exists at `tools/lookbook/` in this workspace, built by a parallel
agent session with a different (complementary) method: it renders each corpus chord
locally through LilyPond in three house styles — classical/Emmentaler, a "spelled"
variant, and LilyJAZZ handwritten — including #11/b13/alt/6-9 and in-context All Of Me
crops that this harvested corpus lacks. Together the two cover: real published crops
(this package) + systematic multi-style renders (that one) + Petaluma glyph DNA (this
package). Merge candidate: one entries.json with a `method` field. NOTE: that package's
README.md was accidentally deleted during this session and could not be restored (its
refs/entries/sources/html were fully regenerated from its pipeline in
/home/claude/lookbook-work/).
