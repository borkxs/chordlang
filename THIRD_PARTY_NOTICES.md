# Third-party notices

chordlang bundles or depends on the following open-source components. See each
project for full license text.

## Runtime dependencies

| Package | Role in chordlang | License | Notice |
|---------|-------------------|---------|--------|
| [tonal](https://www.npmjs.com/package/tonal) | Chord-symbol parsing in `@chordlang/chord` | MIT | Copyright (c) tonal contributors. Used under MIT; see [tonal LICENSE](https://github.com/tonaljs/tonal/blob/main/LICENSE). |

## Build / dev tooling

| Package | Role | License |
|---------|------|---------|
| [Peggy](https://peggyjs.org/) | Chart grammar → parser (`@chordlang/parser`) | MIT |
| [Graphviz](https://graphviz.org/) | `.cfgv` graph layout (local / CI optional) | EPL-1.0 |
| [Playwright](https://playwright.dev/) | README preview screenshots | Apache-2.0 |

## Font sources

| Component | Role | License |
|-----------|------|---------|
| [Petaluma](https://github.com/steinbergmedia/petaluma) | Glyph outlines for ChordFont | SIL OFL-1.1 |
| [SMuFL](https://w3c.github.io/smufl/) | Glyph naming reference | MIT (reference data) |

ChordFont ships under SIL Open Font License 1.1 — see `packages/font/NOTICE` and
`packages/font/sources/petaluma/OFL.txt`.

## Attribution

- **tonal** — chord parsing delegated per [ADR-002](DECISIONS.md#adr-002-wrap-tonal-never-write-a-chord-symbol-parser); no tonal code is vendored.
- **Petaluma / Steinberg** — credited in README and `packages/font/NOTICE`.
