# @chordlang/parser

Peggy parser for **chordlang** chart structure (`.cfmd` lead sheets).

Parses bar grids, section markers, and metadata directives. Chord tokens are
opaque strings — symbol normalization lives in [`@chordlang/chord`](https://www.npmjs.com/package/@chordlang/chord).

The grammar file [`src/chart.peggy`](src/chart.peggy) **is the format spec**.

## Install

```bash
npm install @chordlang/parser
```

## Usage

```js
import { parseChart } from "@chordlang/parser";

const ast = parseChart(`
{title: F Blues}
| F7 | Bb7 | F7 |
`);

// ast.directives, ast.body — bars, sections, barline-end nodes
```

## API

- `parseChart(src: string): ChartAST`
- Types: `ChartAST`, `Bar`, `Section`, `Cell`, `BodyItem`, `Directive`

## Links

- [chordlang monorepo](https://github.com/borkxs/chordlang)
- [Live demo](https://borkxs.github.io/chordlang)
