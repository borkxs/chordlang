# @chordlang/render

Renders a **chordlang** chart AST to engraved HTML.

Chart **layout** (measure grid, sections, beat cells) is emitted as HTML + CSS.
Chord **symbol engraving** is the consumer's job via [ChordFont](https://www.npmjs.com/package/@chordlang/font)
(`@font-face` + `font-feature-settings: "liga" 1, "calt" 1`).

## Install

```bash
npm install @chordlang/render @chordlang/parser @chordlang/chord @chordlang/font
```

## Usage

```js
import { parseChart } from "@chordlang/parser";
import { normalize } from "@chordlang/chord";
import { renderChartToHTML } from "@chordlang/render";

const html = renderChartToHTML(parseChart(source), { normalize, lenient: true });
```

Include layout styles:

```js
import "@chordlang/render/chart.css";
```

Load ChordFont (from `@chordlang/font` or your own `@font-face`).

## API

- `renderChartToHTML(ast, { normalize, lenient? }): string`
- Export `@chordlang/render/chart.css` — chart grid + symbol span styles

## Links

- [chordlang monorepo](https://github.com/borkxs/chordlang)
- [Live demo](https://borkxs.github.io/chordlang)
