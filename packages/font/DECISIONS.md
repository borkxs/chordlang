# Architecture Decisions

Log of significant choices. Format: **Decision → Rationale → Alternatives considered**.

---

## ADR-001: GSUB-only composition (no JS runtime)

**Decision:** Chord symbols are composed entirely by OpenType GSUB features in the font file.

**Rationale:** Proven in HarfBuzz (`tests/shape_test.py`). Works in any text environment that enables `liga` + `calt`. Zero runtime dependency.

**Alternatives:** Pre-rendered ligature lookup table (doesn't scale); JS/SVG renderer (runtime cost, but needed for WALL-tier symbols).

---

## ADR-002: Shaping test harness is the spec

**Decision:** `tests/shape_test.py` defines correct behavior. Every feature ships with a parametrized assertion. CI must stay green.

**Rationale:** Empirical validation before abstraction. OpenType feature interaction is subtle; assertions catch regressions that visual inspection misses.

ChordFont does not tokenize chord symbols at render time; it relies on deterministic OpenType contextual substitution for visual accidental binding (`flat.root` / `sharp.root` immediately after A–G; `flat.alt` / `sharp.alt` elsewhere; digits superscripted only after alterations). Semantic parsing may reject or normalize symbols, but glyph binding is specified by GSUB shape tests.

**GSUB is the engraving spec; the normalizer is the harmony spec.** The font API is ASCII → glyphs; the chord API is messy input → canonical ASCII + meaning.

**Alternatives:** Manual visual QA only (not repeatable); golden image comparison (heavier, outline-dependent); JS tokenizer emitting glyph-class spans at render time (runtime cost, duplicates what GSUB already does for 1D symbols).

---

## ADR-007: Style variant system (Real Book as first target)

**Decision:** Build ChordFont as a style-variant system. The Real Book (modern jazz lead sheet) engraving conventions are the first and default style. Future variants (classical, pop, educational, compact) can be added without changing core infrastructure.

**Rationale:** Professional engraving conventions vary by genre and use case. Jazz lead sheets (Real Book), classical analysis (figured bass), pop charts (all-superscript), and educational materials (larger spacing) have different requirements. By treating the current implementation as the "realbook" style variant, we create runway for multiple styles without breaking existing work.

**Implementation:**
- `styles/realbook/CONVENTIONS.md` documents the target engraving rules
- `references/` contains visual reference materials from published sources (fair use, development only)
- Current GSUB rules and tests implement Real Book conventions
- Future variants will live in `styles/<name>/` with their own conventions docs and test expectations

**Reference:** The New Real Book chord guide (`references/new-real-book-chord-guide.png`) is the gold standard. Our implementation matches their baseline vs. superscript hierarchy.

**Alternatives:** Hard-code one style (not extensible); build all styles up front (premature); runtime JS configuration (defeats font-only goal).

---

## ADR-003: Three-way separation of concerns

**Decision:** Keep glyph outlines, OpenType feature grammar, and input-string grammar in separate modules/docs.

**Rationale:** Godot-style data/logic separation. Outlines can be redrawn without touching GSUB rules. Input dialect can evolve without recompiling features (once a normalizer exists).

**Alternatives:** Monolithic font source with inline comments describing input (doesn't scale).

---

## ADR-004: Chord-string parser — defer, evaluate OSS first

**Decision:** **No parser built yet.** When needed (playground normalizer, pre-flight validation), evaluate OSS before writing our own.

**Evaluation:**

| Library | Language | Strengths | Weaknesses for ChordFont |
|---------|----------|-----------|--------------------------|
| [@tonaljs/chord](https://www.npmjs.com/package/@tonaljs/chord) | JS/TS | Lightweight, `Chord.get("Cmaj7/B")` tokenizes tonic/type/bass, extensible dictionary via `@tonaljs/chord-type`, transpose/detect helpers | JS-only (fine for playground); normalizes to its own symbol format, not our ASCII dialect; does not handle all lead-sheet variants |
| [music21.harmony](https://music21.org/music21docs/moduleReference/moduleHarmony.html) | Python | Mature `ChordSymbol` parser, MusicXML interop, explicitly documents lead-sheet regex support | Heavy dependency (~music21 full stack); Python-only; docs acknowledge "relative diversity of lead sheet chord syntax, not all expressions are supported" |

**Preliminary lean:** `@tonaljs/chord` for the **playground web component** (JS ecosystem, small bundle). A thin **normalizer layer** maps `Chord.get()` output → our `INPUT_GRAMMAR` canonical form. music21 remains useful for **offline validation / corpus testing** of edge cases if we add Python tooling, but is too heavy as a runtime dependency.

**Status:** Open — revisit when normalizer work begins. Neither library solves the dialect problem; both parse *a* chord, not *our* dialect.

---

## ADR-005: Petaluma OFL fork for prototype outlines

**Decision:** Path C — prototype with Petaluma (SIL OFL) outlines now to validate look and the extraction pipeline; keep outlines swappable via `glyphs/source_map.json`; defer the sell-vs-OSS product choice.

**Rationale:** Petaluma is SIL OFL. Deriving outlines from it makes ChordFont an OFL derivative: (a) cannot be sold as a standalone font, (b) must stay OFL, (c) cannot reuse the reserved name "Petaluma". The GSUB feature code and glyph *names* are already decoupled from outlines (ADR-003); swapping source outlines does not touch proven feature logic. If we later want a sellable font, redraw original outlines in the same handwritten style (style is not copyrightable) — pipeline and glyph names stay identical.

**Alternatives:** Path A — stay placeholder-only (blocks visual validation); Path B — commit to OSS/OFL product now (premature before look is proven); Path D — buy/license a commercial engraved font (cost, less control over SMuFL chord-symbol alignment).

---

## ADR-006: WALL-tier symbols → JS/SVG fallback

**Decision:** Parenthesized tension stacks (`G7(♯11)(♭13)`) are out of font scope.

**Rationale:** GSUB is 1D. True 2D vertical stacking of nested parentheses exceeds OpenType layout capabilities.

**Alternatives:** Fake it with pre-drawn composite ligatures (combinatorial explosion); abandon those symbols entirely (too limiting for jazz lead sheets).

---

## ADR-008: Alterations are inline; parentheses are typed opt-in only

**Decision:** Real Book ChordFont does **not** auto-parenthesize alterations. Canonical ASCII is always bare:

| Typed input | Engraved form |
|-------------|-----------------|
| `G7b9`, `C7#11`, `A13b9`, `G7#5b9` | Inline (`G7♭⁹`, `C7♯¹¹`, …) |
| `G7(b9)`, `C7(#11)`, `Bm7(b5)` | Explicit linear parens only when `(` / `)` are typed |

Multi-alteration runs (`G7#5b9`, `B7b5b9b11b13`) stay bare inline. Vertical / multi-tier parenthesized stacks remain WALL (ADR-006).

**Rationale:** Apparent “non-determinism” in the lookbook was not GSUB drift — lookbook `shape_ascii` had been set to LilyJAZZ parenthesized forms for some cards while others stayed inline. That leaked reference house style into the “ours” column. One rule, documented here and locked by shape tests for both branches, is the release gate.

**Lookbook rule:** `shape_ascii` must be the canonical ChordFont input (inline). Reference crops may still show parentheses; the observe checklist notes the house-style difference.

**Shape tests:** `G7b9` / `C7#11` / `A13b9` (inline) and `G7(b9)` / `C7(#11)` (explicit) in `tests/shape_test.py`.

**Alternatives:** Auto-paren 9/11-family after bare `7` (reference-style mimicry — non-obvious, hard to teach); per-ligature paren tuning (exactly the drift this ADR forbids).

---

## ADR-009: Slash-bass metrics — roomy slash, full-size bass

**Decision:**
1. Slash glyph sidebearings are intentionally generous (`slash` advance ≈ 720, left pad via `dx` ≈ 180 so ink clears the preceding digit’s negative RSB) so `Cmaj7/E` and `Ab9/C` do not collide in the PDF text layer or at display size. Note: `build_font.py` currently hardcodes hmtx LSB=50 for every glyph, so left padding must come from `dx` shifting the outline, not from an LSB override.
2. Bass notes after `/` render at **full root size** (OpenBook / Real Book), not a shrunk “bass diminutive.” House styles that shrink bass are a future stylistic-set / style-variant concern, not v1 default.

**Rationale:** Negative/tight slash sidebearings made slash+bass extract as a ligature-like blob (`C△7Æ`). References disagree on bass scale; we pick the Real Book / OpenBook full-size reading for v1 and document it.

**Alternatives:** Shrink bass via a dedicated `bass.root` class (publisher preset later); keep tight slash for denser charts (fails extractability / readability).

---

## ADR-010: v1 house style is Real Book; publisher presets via stylistic sets (planned)

**Decision:** v1 ChordFont Real Book ships one documented house style:

| Axis | v1 engraving | Common reference spellings we do **not** chase |
|------|----------------|--------------------------------------------------|
| Major 7 | `maj` → △7 | `^M7`, bare △, spelled `maj7` |
| Diminished | `dim` / `o` → ° (ring) | Spelled-out `Bdim` |
| Minor | `m` | Dash-minor `D-7` |
| Half-dim | Unicode `ø` → ø; ASCII `m7b5` stays spelled | Publisher choice ø vs m7♭5 |

Shipping one house style (“ChordFont is Real Book style”) is legitimate for v1. Cross-publisher axes become **OpenType stylistic sets** (same GSUB tree, different terminal ligatures) — not more ad-hoc lookbook `shape_ascii` opinions:

| Feature | Planned meaning |
|---------|-----------------|
| `ss01` | Spelled `maj7` (no △) |
| `ss02` | Spelled `dim` (no ° ring) |
| `ss03` | Minus-for-minor (`-` → dash-minor) |
| `ss04` | Prefer ø vs force `m7♭5` presentation |

**Status:** Documented intent only for release. Implementation is post-v1; separate style TTFs (ADR-007 / Pop) remain for large layout differences (all-superscript, etc.). See also `STYLE_VARIANTS.md` and lookbook entry `ext-dorico-presets`.

**Alternatives:** Encode every publisher spelling as default (impossible single face); runtime JS rewriting only (works, but loses the “publisher presets as font features” productization path).

---

## OSS dependency log

| Dependency | Purpose | Build or use? |
|------------|---------|---------------|
| [Petaluma](https://github.com/steinbergmedia/petaluma) (OFL) | Source outlines for prototype glyphs (`sources/petaluma/`, pinned ref) | **Use** (build-time extract only; see ADR-005) |
| [fontTools](https://github.com/fonttools/fonttools) | Font building, feaLib GSUB compilation | **Use** |
| [uharfbuzz](https://github.com/harfbuzz/uharfbuzz) | Shaping assertions in tests | **Use** |
| [pytest](https://pytest.org) | Test runner | **Use** (dev) |
| @tonaljs/chord | Future input normalizer | **Evaluate** (ADR-004) |
| music21 | Future corpus validation | **Evaluate** (ADR-004) |
