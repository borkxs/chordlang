# Pop/Rock Engraving Style

Pop and rock music chord notation conventions, as seen in classic songbooks from The Beatles, Beach Boys, and other popular artists of the 1960s-1980s.

## Reference Materials

- **Examples:** "Yesterday" (The Beatles), "God Only Knows" (Beach Boys)
- **Sources:** Hal Leonard pop songbooks, Ultimate Guitar chord transcriptions

## Visual Conventions

### Typography Hierarchy

1. **Baseline (full size):**
   - Root note (A–G)
   - Root accidentals (♯, ♭ immediately after root)
   - Quality indicators (M for major, m for minor, dim spelled out)

2. **Superscript (reduced size, raised):**
   - **ALL extensions** (7, 9, 11, 13) - unlike Real Book which keeps base extensions at baseline
   - Alteration accidentals (♯, ♭ applied to extensions)
   - Altered extension numbers following alterations (♯11, ♭9, ♭5, ♯5)
   - "sus" and "add" suffixes (sus4, add9)

3. **Slash notation:**
   - Slash separator in compound chords (6/9)
   - Bass note indicators (C/E)

### Specific Examples (Pop style)

```
CM7        →  CM⁷        (M baseline, 7 superscript)
Cm7        →  Cm⁷        (m baseline, 7 superscript)
C7         →  C⁷         (7 superscript - differs from Real Book)
Cm7♭5      →  Cm⁷♭⁵      (7 baseline, ♭5 superscript)
Cdim7      →  C○⁷        (ring symbol, 7 superscript)
C+         →  C+         (all baseline)

C6         →  C⁶         (6 superscript - differs from Real Book)
C6/9       →  C⁶/⁹       (both superscript)
Csus4      →  Csus⁴      (sus baseline, 4 superscript)
Csus2      →  Csus²      (sus baseline, 2 superscript)

C9         →  C⁹         (9 superscript)
C13        →  C¹³        (13 superscript)
C7♭9       →  C⁷♭⁹       (7 superscript, ♭9 superscript)
C7♯9       →  C⁷♯⁹       (7 superscript, ♯9 superscript)
C7♯11      →  C⁷♯¹¹      (7 superscript, ♯11 superscript)

CM7        →  CM⁷        (M baseline, 7 superscript)
CM9        →  CM⁹        (M baseline, 9 superscript)
```

## GSUB Rule Implications

### Major Quality Symbol

**Pop convention:** Use uppercase "M" for major seventh chords instead of triangle (△).
- `CM7` → "C" + "M" + "⁷" (superscript 7)
- Some pop books also use "maj" spelled out, but "M" is most common in sheet music

### Universal Superscripting

**Key difference from Real Book:** ALL digits are superscripted in pop style, not just alterations.

```
# Pop style: superscript everything after the root and quality
C 7 → C ⁷ (7 is superscripted)
C M 7 → C M ⁷ (M baseline, 7 superscripted)
C m 9 → C m ⁹ (m baseline, 9 superscripted)
```

### Ligature Substitutions

- NO `maj` → △ ligature (pop uses "M" not triangle)
- `dim` → ○ (ring) - same as Real Book
- Root accidentals: `#` after root → `♯.root`, elsewhere → `♯.alt`
- Root accidentals: `b` after root → `♭.root`, elsewhere → `♭.alt`

## Design Principles

1. **Clarity for non-jazz readers:** Pop musicians may not be familiar with jazz symbols like △
2. **Superscript everything:** Makes chord extensions visually distinct from root
3. **Spelled-out quality:** "M" is unambiguous (unlike triangle which might confuse beginners)
4. **Same accidental binding:** Sharp/flat glyphs still "attach" to their target

## Differences from Real Book

### vs. Real Book (Jazz)
- **Major symbol:** "M" vs △ (triangle)
- **Extension positioning:** ALL superscripted vs baseline for 7/9/11/13
- **Visual weight:** More vertical (superscripts) vs horizontal (baseline)

### Real Book Example (for comparison)
```
Real Book: Cmaj7 → C△7 (all baseline)
Pop:       CM7   → CM⁷ (7 superscript)

Real Book: C13 → C13 (all baseline)
Pop:       C13 → C¹³ (13 superscript)
```

## Historical Context

Pop/rock chord notation evolved from:
1. **Classical figured bass** (numbers above/below staff)
2. **Guitar method books** (emphasis on chord names over symbols)
3. **Folk music tradition** (simpler, spelled-out qualities)

The "M" convention became standard in Hal Leonard and other pop songbook publishers starting in the 1970s, as these publishers wanted notation that was immediately readable by guitarists and pianists who might not read jazz lead sheets.

## Future Variants

This style could branch into:
- **folk:** Even more spelled-out (major, minor, diminished written in full)
- **modern-pop:** Slash chords emphasized (C/E, D/F# very common)
- **guitar-tab-style:** Optimized for chord diagrams above lyrics

---

**Status:** ✅ Implemented (as of 2026-07) with all-superscript extensions and "M" for major.

**Test coverage:** See `../../tests/shape_test.py` — pop style tests use separate assertions from Real Book.
