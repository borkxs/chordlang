# @chordlang/graph

Renders **chordlang** harmonic graphs (`.cfgv` Graphviz DOT) to styled SVG.

Node labels should use `fontname="ChordFont"` in the DOT source; supply the font
via [`@chordlang/font`](https://www.npmjs.com/package/@chordlang/font) or your
own `@font-face`.

## Install

```bash
npm install @chordlang/graph
```

## Usage

```js
import { renderDotToSvg } from "@chordlang/graph";

const dot = `
digraph {
  node [shape=plaintext fontname="ChordFont"];
  Am7 -> D7 -> Gmaj7;
}
`;

const svg = await renderDotToSvg(dot);
```

Optional consumer styles for SVG text nodes:

```js
import "@chordlang/graph/graph.css";
```

For repeated renders, reuse a loaded instance:

```js
import { loadGraphviz, renderDot } from "@chordlang/graph";

const gv = await loadGraphviz();
const svg = renderDot(gv, dot);
```

## API

- `loadGraphviz()` — load Graphviz WASM once
- `renderDot(graphviz, dot)` — DOT → styled SVG string
- `renderDotToSvg(dot)` — one-shot convenience
- `styleSvg(svg)` — add `graph-svg` class to root `<svg>`

## Links

- [chordlang monorepo](https://github.com/borkxs/chordlang)
- [Graph demo](https://borkxs.github.io/chordlang/graph/ii-v-i-chain/)
