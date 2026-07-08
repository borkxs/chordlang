# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions use
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `docs/font-integrations.md` — verified free integrations beyond Graphviz
  (XeLaTeX, LuaLaTeX, Typst, LilyPond, Pango, ffmpeg `drawtext`), with
  runnable sources in `examples/integrations/`.

### Fixed

- ChordFont name table now includes unique ID, full name, version, and
  PostScript name records (IDs 3–6). Fonts built without them render blank in
  LilyPond, are undiscoverable in Typst, and crash LuaLaTeX's HarfBuzz loader.

## [0.1.1] - 2026-07-05

### Added

- Package READMEs on npm for `@chordlang/parser`, `chord`, `render`, `graph`, `cli`, and `font`.
- Root README "Install from npm" section.

## [0.1.0] - 2026-07-05

First public release: structured chord-chart pipeline, ChordFont engraving,
playground demo, and CLI.

### Added

- **@chordlang/parser** — Peggy grammar for `.cfmd` chart structure (grammar is the spec).
- **@chordlang/graph** — Graphviz DOT → styled SVG for `.cfgv` harmonic graphs.
- **@chordlang/font** — ChordFont TTF + OFL notice on npm.
- **@chordlang/chord** — tonal-backed chord-symbol normalizer → canonical struct.
- **@chordlang/render** — AST → engraved HTML + `chart.css` layout styles.
- **@chordlang/cli** — `chordlang <ast|canonical|html> file.cfmd`.
- **ChordFont** — OpenType GSUB ligature engraving (Python build in `packages/font/`).
- **Playground** — live chart editor and graph demo on GitHub Pages.
- **Examples** — `.cfmd` charts, `.cfgv` Graphviz graphs, committed README preview PNGs.

[Unreleased]: https://github.com/borkxs/chordlang/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/borkxs/chordlang/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/borkxs/chordlang/releases/tag/v0.1.0
