# Input Grammar (ASCII Chord Dialect)

> **Status:** Stub — open problem. There is **no standardized ASCII chord-symbol dialect**.
> This document is the single source of truth for what the font expects *and* what any
> future JS normalizer must produce. Both systems read from here.

## Canonical form (target)

The font's GSUB rules operate on a **normalized ASCII string** where:

- Root letter: `A`–`G`
- Accidental: `#` (sharp) or `b` (flat) immediately after root
- Quality tokens: literal ASCII (`maj`, `m`, `dim`, `aug`, `sus`, `add`, …)
- Extensions: bare digits (`7`, `9`, `11`, `13`) — superscripting handled by GSUB
- Alterations: `b5`, `#11`, etc. — digit superscripting after accidental substitution
- Slash bass: `/` + pitch class (`Cmaj7/E`)

Example canonical strings (current proof scope):

```
Cmaj7      →  C + maj + 7
F#m7       →  F + # + m + 7
Dm7b5      →  D + m + 7 + b + 5
G13        →  G + 13
Bb         →  B + b
E7b5       →  E + 7 + b + 5   (not Eb + 7 + 5)
Eb7b5      →  E + b + 7 + b + 5
```

Visual accidental binding is **not** decided here — it is specified by GSUB shape
tests (`tests/shape_test.py`). This grammar defines the canonical ASCII token order
that both the normalizer must emit and the font must accept.

## Open problem: variant normalization

Real-world lead sheets use incompatible spellings for the same harmony.
Any normalizer must map these → canonical form before the font sees them.

### Major quality

| Variants seen | Canonical |
|---------------|-----------|
| `maj`, `M`, `MAJ`, `Ma` | `maj` |
| `△`, `Δ`, `maj7` triangle symbol | `maj` (font ligates `maj` → △) |
| `j` (typo/alternate) | `maj` |

### Minor quality

| Variants seen | Canonical |
|---------------|-----------|
| `m`, `min`, `-` (Real Book style) | `m` |
| `mi` | `m` |

### Diminished

| Variants seen | Canonical |
|---------------|-----------|
| `dim`, `o`, `°` | `dim` |
| `dim7`, `o7`, `°7` | `dim7` |

### Half-diminished

| Variants seen | Canonical |
|---------------|-----------|
| `m7b5`, `ø`, `hdim`, `min7b5` | `m7b5` |

### Augmented

| Variants seen | Canonical |
|---------------|-----------|
| `aug`, `+`, `+7` | `aug` / `+7` |

### Flat-five / altered fifth

| Variants seen | Canonical |
|---------------|-----------|
| `b5`, `-5`, `♭5`, `(b5)` | `b5` |

### Slash chords (inversions / poly-chords)

| Variants seen | Canonical |
|---------------|-----------|
| `C/E`, `Cmaj7/G`, `D/F#` | root + quality + `/` + bass |
| Poly-chord notation `D/E` | **TBD** — ambiguous with slash; needs context |

### Sus / add ordering

| Variants seen | Notes |
|---------------|-------|
| `Csus4`, `C7sus4`, `Cadd9`, `C6/9` | Order matters for GSUB lookahead |
| `C9sus4` vs `Csus4(9)` | **TBD** — define canonical token order |

### Altered dominants (`7alt`)

| Variants seen | Notes |
|---------------|-------|
| `7alt`, `7alt.` | Shorthand for ♭9/#9/♭13/#11 — **TBD** whether font expands or normalizer does |
| Explicit `C7b9`, `C7#9`, `C7b13` | Preferred; maps to superscript digits |

## Out of font scope (WALL tier)

These require 2D layout — normalizer should flag them for SVG fallback:

```
G7(♯11)(♭13)     # parenthesized vertical tension stacks
C7(♭9♯11)        # multi-alteration parentheses
```

## Next steps

1. Collect a corpus of real lead-sheet symbols (Real Book, iReal Pro export, etc.)
2. Define canonical token order (root → accidental → quality → extensions → alterations → bass)
3. Implement normalizer (see ADR-004 in `DECISIONS.md`)
4. Add shaping assertions for each newly supported canonical form
