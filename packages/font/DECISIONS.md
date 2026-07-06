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

## OSS dependency log

| Dependency | Purpose | Build or use? |
|------------|---------|---------------|
| [Petaluma](https://github.com/steinbergmedia/petaluma) (OFL) | Source outlines for prototype glyphs (`sources/petaluma/`, pinned ref) | **Use** (build-time extract only; see ADR-005) |
| [fontTools](https://github.com/fonttools/fonttools) | Font building, feaLib GSUB compilation | **Use** |
| [uharfbuzz](https://github.com/harfbuzz/uharfbuzz) | Shaping assertions in tests | **Use** |
| [pytest](https://pytest.org) | Test runner | **Use** (dev) |
| @tonaljs/chord | Future input normalizer | **Evaluate** (ADR-004) |
| music21 | Future corpus validation | **Evaluate** (ADR-004) |
