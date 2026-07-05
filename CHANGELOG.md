# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions use
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- GitHub Actions CI (`make test`, `make lint`, preview drift check).
- npm publish metadata on `@chordlang/*` packages (`files`, `exports`, `prepublishOnly`).
- `CONTRIBUTING.md`, issue/PR templates, `THIRD_PARTY_NOTICES.md`.

## [0.1.0] - TBD

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

[Unreleased]: https://github.com/borkxs/chordlang/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/borkxs/chordlang/releases/tag/v0.1.0
