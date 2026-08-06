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
- Measure repeat: `%` — chart-level cell meaning “same as previous bar”
  (iReal / Real Book). The font maps `%` to Petaluma `repeat1Bar` (slash +
  dots), **not** a percent sign.

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

| Variants seen | Canonical / font input |
|---------------|------------------------|
| `m7b5`, `min7b5`, `hdim` | Canonical harmony: `m7b5` (spelled; GSUB → `m` `7` `b5`) |
| `ø`, `ø7`, `Bø7` | **Font engraved form** — type Unicode `ø` (U+00F8); maps to `hdim.slash` (Petaluma `csymHalfDiminished`). Do **not** use ASCII `o` (that is full-diminished). |

Spelled `Bm7b5` and engraved `Bø7` are both supported inputs; the normalizer may fold `ø` → `m7b5` for analysis while the font keeps `ø` for Real Book–style engraving.

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

### Alterations — inline by default (ADR-008)

Canonical Real Book ASCII is **bare**. The font never inserts parentheses:

| Input | Engraved stream |
|-------|-----------------|
| `G7b9` | `G` `7` `♭` `⁹` |
| `C7#11` | `C` `7` `♯` `¹¹` |
| `A13b9` | `A` `1` `3` `♭` `⁹` |
| `G7#5b9` | `G` `7` `♯` `⁵` `♭` `⁹` |

### Linear parentheses (opt-in — 1D)

Parentheses appear only when typed. Use them to match a publisher that
parenthesizes tensions; they are not required for correct Real Book engraving:

| Input | Engraved stream |
|-------|-----------------|
| `G7(b9)` | `G` `7` `(` `♭` `⁹` `)` |
| `C7(#11)` | `C` `7` `(` `♯` `¹¹` `)` |
| `Bm7(b5)` | `B` `m` `7` `(` `♭` `⁵` `)` |

## Stacked tensions (closed allowlist — ADR-012)

Real Book **stacks** use one tall paren with two alteration rows (higher degree on
top). Canonical ASCII is **slash-inside-one-paren**, not sequential `()()`:

| Input | Glyph stream (abbrev.) | Visual |
|-------|------------------------|--------|
| `G7(#11/b9)` | `G d7 stack.sharp11.flat9` | Tall paren, #11 over b9 |
| `C7(#11/b9)` | same stack tail (root-agnostic) | |

Allowlist + atoms: [`stacks/allowlist.json`](../stacks/allowlist.json).  
Design note: [`docs/design/stack-ligatures.md`](../../../docs/design/stack-ligatures.md).

Sequential `G7(#11)(b9)` shapes as **linear** 1D (two short paren groups) — not a
stack. Normalizer may rewrite stack-intent input to slash-inside-one-paren.

## Out of font scope (WALL tier)

Open-ended 2D — normalizer should flag for SVG (or future allowlist entries):

```
C7(♭9♯11)              # multi-alt in one paren without slash encoding / not allowlisted
G7(#11/#9/b13)         # depth > 2
Bb(add b13/add 9)      # verbal add/omit stacks (word glyphs)
```

## Next steps

1. Collect a corpus of real lead-sheet symbols (Real Book, iReal Pro export, etc.)
2. Define canonical token order (root → accidental → quality → extensions → alterations → bass)
3. Implement normalizer (see ADR-004 in `DECISIONS.md`)
4. Add shaping assertions for each newly supported canonical form
