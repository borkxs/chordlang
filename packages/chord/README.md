# @chordlang/chord

Chord-symbol normalizer for **chordlang** — wraps [tonal](https://www.npmjs.com/package/tonal)
with a pre-fold (dialect variants) and post-fold (canonical struct).

Does **not** parse chart structure; use [`@chordlang/parser`](https://www.npmjs.com/package/@chordlang/parser) for that.

## Install

```bash
npm install @chordlang/chord
```

## Usage

```js
import { normalize } from "@chordlang/chord";

const c = normalize("F#m7b5");
// c.render.ascii, c.render.harte, c.factors, c.bass, …
```

Handles `7alt` as underspecified (no fabricated voicing), and treats `ø7` and
`m7b5` as equivalent.

## API

- `normalize(symbol: string): Canonical`

## Links

- [chordlang monorepo](https://github.com/borkxs/chordlang)
