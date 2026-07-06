# Font Style Variation Architecture

Two approaches for supporting multiple chord notation conventions (triangle △ vs "maj." vs "M", etc.) within ChordFont.

---

## Background

Different musical traditions use different symbols for the same chord quality:

| Quality | Real Book (jazz) | Pop/rock | Educational | Classical |
|---------|------------------|----------|-------------|-----------|
| Major 7th | `Cmaj7` → C△7 | `Cmaj7` → CM7 or CM⁷ | `Cmaj7` → Cmaj7 | `Cmaj7` → CM7 |
| Minor | `Cm7` → Cm7 | `Cm7` → Cmin7 or C⁻⁷ | `Cm7` → Cmin7 | `Cm7` → Cm7 |
| Diminished | `Cdim7` → C○7 | `Cdim7` → Cdim7 or C°7 | `Cdim7` → Cdim7 | `Cdim7` → C°7 |
| Half-diminished | `Cm7b5` → Cm7♭⁵ | `Cm7b5` → Cø7 or C⌀7 | `Cm7b5` → Cm7(♭5) | `Cm7b5` → Cø7 |
| Extensions | `C7` → C7 (baseline) | `C7` → C⁷ (superscript) | `C7` → C7 (baseline) | `C7` → C7 |

Users need to choose their preferred notation style based on genre, publisher conventions, or personal preference.

---

## Option A: Single Font with OpenType Stylistic Sets

### Concept

Build **one font file** (e.g., `ChordFont.ttf`) containing all glyph variants. Users select their preferred style via OpenType features:

- `ss01` (Stylistic Set 1) = Real Book style (default: △ for major, ○ for dim)
- `ss02` (Stylistic Set 2) = Pop style (M for major, all extensions superscripted)
- `ss03` (Stylistic Set 3) = Educational style (spelled-out "maj", "min", "dim")
- `ss04` (Stylistic Set 4) = Classical style (specific figured-bass conventions)

Or use Character Variants:
- `cv01` = major symbol choice (△ / M / maj.)
- `cv02` = minor symbol choice (m / min / -)
- `cv03` = diminished symbol choice (○ / dim / °)
- `cv04` = half-diminished symbol (ø / ⌀)

### How It Works

1. **Glyph Design:**
   - Extract or design all variants: `maj.tri` (△), `maj.m`, `maj.spelled` (maj.), etc.
   - Store in `glyphs/source_map.json` with descriptive names

2. **Feature Code (`.fea`):**
   ```fea
   # Default: Real Book style
   feature liga {
       sub m a j by maj.tri;
       sub d.lc i m by dim.ring;
   } liga;

   # Stylistic Set 01: Pop style (spelled out M)
   feature ss01 {
       sub maj.tri by maj.m;
       sub dim.ring by dim.spelled;
   } ss01;

   # Stylistic Set 02: Educational style (full words)
   feature ss02 {
       sub maj.tri by maj.spelled;
       sub dim.ring by dim.spelled;
   } ss02;

   # Character Variant 01: Major symbol options
   feature cv01 {
       sub maj.tri by maj.m;  # User can cycle through variants
   } cv01;
   ```

3. **CSS Usage:**
   ```css
   /* Default Real Book style */
   .chord {
       font-family: "ChordFont";
       font-feature-settings: "liga", "calt";
   }

   /* Pop style */
   .chord-pop {
       font-family: "ChordFont";
       font-feature-settings: "liga", "calt", "ss01";
   }

   /* Educational style */
   .chord-educational {
       font-family: "ChordFont";
       font-feature-settings: "liga", "calt", "ss02";
   }
   ```

4. **Playground UI:**
   - Dropdown or toggle: "Style: Real Book | Pop | Educational"
   - Updates `font-feature-settings` dynamically

### Advantages

✅ **Single distribution artifact**
   - One npm package, one TTF file
   - Users download once, switch styles in CSS

✅ **Consistent metrics**
   - All variants share same advance widths, kerning, baseline alignment
   - Layout doesn't shift when switching styles

✅ **Easier maintenance**
   - GSUB rules centralized
   - Fix a bug once, applies to all styles

✅ **Runtime flexibility**
   - Users can switch styles without re-downloading
   - A/B comparison in same document

✅ **Standard OpenType approach**
   - Used by professional fonts (e.g., Adobe fonts with swash alternates)
   - Supported by all modern shaping engines

### Disadvantages

❌ **Larger file size**
   - All glyph variants included even if user only needs one style
   - ~3-5x larger than single-style font (estimated 80-150 KB vs 30-40 KB)

❌ **Feature code complexity**
   - Must maintain GSUB rules for all style interactions
   - Testing matrix grows: each feature × each stylistic set

❌ **UI/documentation burden**
   - Users must understand OpenType feature syntax
   - Requires clear docs on which `ss##` does what

❌ **Partial browser support for `cv##`**
   - Character variants less supported than stylistic sets
   - May need to stick with `ss##` for widest compatibility

### Implementation Path

1. **Phase 1:** Add glyph variants to `glyphs/source_map.json`
   - `maj.tri` (current △), `maj.m` (M), `maj.spelled` (maj.)
   - `dim.ring` (current ○), `dim.spelled` (dim)
   - Minor variants: `m`, `min.spelled`, `minus.sup`

2. **Phase 2:** Extend `build_font.py` with stylistic set features
   - Add `ss01`, `ss02`, `ss03` blocks to feature code
   - Ensure contextual substitution (`calt`) doesn't conflict

3. **Phase 3:** Update tests in `tests/shape_test.py`
   - Parametrize tests: `test_Cmaj7(style="realbook")`, etc.
   - Assert correct glyph stream for each feature setting

4. **Phase 4:** Playground UI for style selection
   - Dropdown updates `font-feature-settings`
   - Visual comparison mode (split screen)

5. **Phase 5:** Document in README
   - CSS snippets for each style
   - Table of `ss##` meanings

---

## Option B: Multiple Font Files (Font Family Variants)

### Concept

Build **separate font files** for each style:

- `ChordFont-RealBook.ttf` (default △ for major, ○ for dim)
- `ChordFont-Pop.ttf` (M for major, all extensions superscripted)
- `ChordFont-Educational.ttf` (spelled-out "maj", "min", "dim")
- `ChordFont-Classical.ttf` (figured bass conventions)

Each font is a standalone artifact with its own feature code and glyph subset.

### How It Works

1. **Build System:**
   - Parameterized `build_font.py --style=realbook|pop|educational|classical`
   - Reads style-specific config: `styles/realbook/config.json`, etc.
   - Config specifies which glyphs to include and GSUB rules to apply

2. **Glyph Selection:**
   - `styles/realbook/config.json`:
     ```json
     {
       "major_glyph": "maj.tri",
       "dim_glyph": "dim.ring",
       "extensions_baseline": true
     }
     ```
   - `styles/pop/config.json`:
     ```json
     {
       "major_glyph": "maj.m",
       "dim_glyph": "dim.spelled",
       "extensions_baseline": false
     }
     ```

3. **Feature Code:**
   - Each style has its own `.fea` snippet in `styles/<name>/features.fea`
   - `build_font.py` injects the appropriate snippet at compile time

4. **Distribution:**
   - npm package exports all variants:
     ```
     @chordlang/font/ChordFont-RealBook.ttf
     @chordlang/font/ChordFont-Pop.ttf
     @chordlang/font/ChordFont-Educational.ttf
     ```
   - Or separate packages: `@chordlang/font-realbook`, etc.

5. **CSS Usage:**
   ```css
   @font-face {
       font-family: "ChordFont";
       src: url("ChordFont-RealBook.ttf");
   }

   /* Or for pop style: */
   @font-face {
       font-family: "ChordFont";
       src: url("ChordFont-Pop.ttf");
   }
   ```

### Advantages

✅ **Smaller file size per variant**
   - Each font only includes glyphs for its style
   - Users download only what they need (~30-40 KB per font)

✅ **Simpler feature code**
   - No complex multi-style GSUB rules
   - Each font is standalone, easier to reason about

✅ **Easier for end users**
   - Just load the right TTF file
   - No need to understand OpenType features or `font-feature-settings`

✅ **Better dead-code elimination**
   - If a project only uses Real Book style, bundlers can tree-shake the rest

✅ **Clearer testing**
   - Each font is tested independently
   - No interaction between styles to debug

### Disadvantages

❌ **Multiple distribution artifacts**
   - 4+ font files to manage in npm
   - Version skew risk (user loads mixed versions)

❌ **No runtime style switching**
   - Changing styles requires reloading a different font file
   - Cannot A/B compare styles in same document without loading both fonts

❌ **Maintenance burden**
   - Bug fixes must be replicated across all style configs
   - Risk of drift (one style gets updated, others lag)

❌ **Metrics inconsistency**
   - If glyph widths differ between styles, layout shifts on style change
   - Requires careful coordination of advance widths across variants

❌ **User confusion**
   - Which font file should I load?
   - "Why doesn't `maj` render as a triangle in the pop font?"

### Implementation Path

1. **Phase 1:** Style config schema
   - Define JSON schema for `styles/<name>/config.json`
   - Glyph mappings, feature flags, typography rules

2. **Phase 2:** Parameterize `build_font.py`
   - Accept `--style` CLI arg
   - Read config, filter glyph set, inject feature code

3. **Phase 3:** Build all variants in CI
   - `make build-all-styles` → 4+ TTF outputs
   - Package all in npm tarball or separate packages

4. **Phase 4:** Update tests
   - `tests/shape_test.py` runs for each style variant
   - Assertions differ per style (triangle vs M vs "maj")

5. **Phase 5:** Document in README
   - Table of font files and use cases
   - Migration guide if users want to switch styles

---

## Recommendation

### For v0.2.0 (Next Release)

**Start with Option B: Multiple Font Files**

**Rationale:**
- Simpler implementation (no complex OpenType feature interactions)
- Easier for users (just load the TTF you want)
- Validates demand (are users actually asking for multiple styles?)
- Smaller download for most users (they pick one style)

**Ship 2-3 variants first:**
1. **ChordFont-RealBook.ttf** (default, current implementation)
2. **ChordFont-Pop.ttf** (all-superscript extensions, "M" for major)
3. (Optional) **ChordFont-Educational.ttf** (spelled-out quality names)

**Implementation:**
- Refactor `build_font.py` to accept `--style` flag
- Move current feature code to `styles/realbook/features.fea`
- Add `styles/pop/features.fea` with pop conventions
- CI builds all styles: `make build-realbook build-pop build-educational`
- Publish as `@chordlang/font` with all TTFs exported

### For v0.3.0+ (Future)

**Consider Option A: Stylistic Sets** if:
- Users frequently request runtime style switching
- We want to reduce distribution overhead (one font to rule them all)
- Browser/tooling support for OpenType features is better documented

**Hybrid approach (best of both worlds):**
- Publish a **unified font** (`ChordFont-AllStyles.ttf`) with `ss01`, `ss02`, etc.
- **Also** publish individual style fonts for users who want smaller files
- Let users choose: "download one big font with runtime switching" vs "download small single-style font"

---

## Migration Path

### From Separate Fonts → Unified Font

If we start with Option B (multiple files) and later add Option A (stylistic sets):

1. Keep existing separate fonts for backwards compatibility
2. Introduce `ChordFont-AllStyles.ttf` as a new export
3. Document migration:
   ```css
   /* Old way (still works) */
   @font-face {
       font-family: "ChordFont";
       src: url("ChordFont-RealBook.ttf");
   }

   /* New way (unified font) */
   @font-face {
       font-family: "ChordFont";
       src: url("ChordFont-AllStyles.ttf");
   }
   .chord-realbook { font-feature-settings: "ss01"; }
   .chord-pop { font-feature-settings: "ss02"; }
   ```

### From Unified Font → Separate Fonts

If we start with Option A and later split into Option B:

1. Extract glyphs for each `ss##` feature into standalone fonts
2. Keep unified font for users who want it
3. Document that separate fonts are now available for smaller bundle size

---

## Open Questions

1. **Naming convention:**
   - `ChordFont-RealBook.ttf` vs `ChordFont-realbook.ttf`?
   - Family name in font metadata: "ChordFont Real Book" or "ChordFont-RealBook"?

2. **Default style:**
   - If we ship multiple fonts, which is the "default" export from `@chordlang/font`?
   - Real Book (current), or most widely requested?

3. **Style detection:**
   - Should we auto-detect style from input conventions? (e.g., user types "Cmaj7" → use Real Book; "CM7" → use pop)
   - Or require explicit style selection?

4. **Web font loading:**
   - If separate fonts, do we need `font-display: swap` guidance?
   - What's the impact of loading 3-4 fonts on page load time?

5. **Variable fonts (future):**
   - Could we use OpenType variable font axes for style selection?
   - E.g., `font-variation-settings: 'STYL' 1` for Real Book, `'STYL' 2` for pop?
   - More advanced, but future-proof

---

## References

- [OpenType Feature Tags](https://docs.microsoft.com/en-us/typography/opentype/spec/featuretags)
- [Stylistic Sets (ss01–ss20)](https://docs.microsoft.com/en-us/typography/opentype/spec/features_pt#tag-ss01--ss20)
- [Character Variants (cv01–cv99)](https://docs.microsoft.com/en-us/typography/opentype/spec/features_ae#tag-cv01--cv99)
- [Variable Fonts](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Fonts/Variable_Fonts_Guide)
- Existing multi-style fonts: Adobe Source Code Pro (has stylistic sets), Fira Code (ligature variants)

---

**Status:** 🟡 Proposal — awaiting decision on Option A vs Option B for v0.2.0
