# Real Book Engraving Style

The canonical modern jazz lead sheet standard, as established by The New Real Book
(Sher Music Co.) and widely adopted across professional jazz charts.

## Reference Materials

- **Primary:** `../../references/new-real-book-chord-guide.png` — official chord type guide
- **Source:** The New Real Book chord symbol conventions

## Visual Conventions

### Typography Hierarchy

1. **Baseline (full size):**
   - Root note (A–G)
   - Root accidentals (♯, ♭ immediately after root)
   - Quality indicators (△, ○, m, etc.)
   - Base extensions (7, 9, 11, 13)

2. **Superscript (reduced size, raised):**
   - Alteration accidentals (♯, ♭ applied to extensions)
   - Altered extension numbers following alterations (#11, ♭9, ♭5, #5)
   - "alt" suffix
   - Sus/add numbers (sus4, add9)

3. **Slash notation:**
   - Slash separator in compound chords (6/9)
   - Bass note indicators (`C/E`) at **full root size** (not shrunk)
   - Slash sidebearings stay roomy so bass does not collide (ADR-009)

4. **Alterations — no auto-parentheses (ADR-008):**
   - Canonical form is inline: `C7♭9`, `C7♯11`, `G7♯5♭9`
   - Typed `G7(b9)` keeps linear parens; the font never inserts them
   - Closed 2-high stacks use slash-inside-one-paren: `G7(#11/b9)` (ADR-012)
   - Open-ended / depth≥3 / verbal add-omit towers remain WALL (ADR-006)

### Specific Examples (from Real Book guide)

```
Cmaj7      →  C△7        (all baseline)
Cm7        →  Cm7        (all baseline)
C7         →  C7         (all baseline)
Cm7♭5      →  Cm7♭⁵      (7 baseline, ♭5 superscript)
Cdim7      →  C○7        (all baseline)
C+         →  C+         (all baseline)

C6         →  C6         (all baseline)
C6/9       →  C6/9       (slash at baseline size)
Csus4      →  Csus4      (all baseline)
Csus2      →  Csus2      (all baseline)

C9         →  C9         (all baseline)
C13        →  C13        (all baseline)
C7♭9       →  C7♭⁹       (7 baseline, ♭9 superscript; inline, not parenthesized)
C7#9       →  C7#⁹       (7 baseline, #9 superscript; inline)
C7♯11      →  C7#¹¹      (7 baseline, #11 superscript; inline)
G7(b9)     →  G7(♭⁹)     (parens only when typed — ADR-008)
C7alt      →  C7ᵃˡᵗ      (7 baseline, alt superscript)
Cmaj7/E    →  C△7/E      (slash + full-size bass — ADR-009)

Cmaj7#11   →  C△7#¹¹     (△7 baseline, #11 superscript)
Cmaj9      →  C△9        (all baseline)
```

## GSUB Rule Implications

### Contextual Superscripting

**Current implementation (ADR-011):** Digits are superscripted **only** when they
appear after an alteration accidental (`flat.alt` or `sharp.alt`), or immediately
inside typed linear parentheses. Primary extensions (`7`, `9`, `11`, `13`) stay
on the baseline — chosen Real Book hierarchy, not an accident.

```
# Baseline context (no superscript)
root quality extension → C maj.tri 7
root extension → C 7
root multi-digit → C 13 (rendered as "C" + "1" + "3" at baseline)

# Superscript context (after alteration)
root extension alteration → C 7 sharp.alt 11.sup
root quality extension alteration → C maj.tri 7 sharp.alt 11.sup
```

### Ligature Substitutions

- `maj` → △ (triangle)
- `dim` → ○ (ring)
- Root accidentals: `#` after root → `♯.root`, elsewhere → `♯.alt`
- Root accidentals: `b` after root → `♭.root`, elsewhere → `♭.alt`

## Design Principles

1. **Horizontal compactness:** Keep symbols tight for dense chart notation
2. **Visual hierarchy:** Base chord structure (root + quality + primary extension) dominates; alterations are secondary
3. **Baseline dominance:** Most symbols sit on the baseline for rhythmic readability
4. **Accidental binding:** Sharp/flat glyphs visually "attach" to their target (root or extension)

## Differences from Other Styles

### vs. Classical engraving
- Classical uses stacked Roman numerals and more verbose figured bass
- Jazz emphasizes horizontal compactness and immediate readability

### vs. Pop/rock charts
- Pop often superscripts all extensions (C⁷, C⁹)
- Real Book keeps base extensions at baseline for clarity

### vs. Historic fake books
- Pre-Real Book fake books were inconsistent
- Real Book standardized modern conventions in the 1970s

## Future Style Variants

Potential alternate styles to support:
- **classical:** Stacked analysis (Roman numerals, figured bass)
- **pop:** All extensions superscripted
- **educational:** More spacing, larger symbols
- **compact:** Maximum horizontal compression for dense arrangements

---

**Status:** ✅ Current implementation (as of 2026-07) matches Real Book conventions
for baseline vs. superscript rendering.

**Test coverage:** See `../../tests/shape_test.py` — all cases validated against
Real Book guide.
