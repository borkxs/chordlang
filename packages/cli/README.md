# @chordlang/cli

Command-line tool for **chordlang** `.cfmd` chart files.

## Install

```bash
npm install -g @chordlang/cli
```

## Usage

```bash
chordlang ast path/to/chart.cfmd
chordlang canonical path/to/chart.cfmd
chordlang html path/to/chart.cfmd
```

| Command | Output |
|---------|--------|
| `ast` | JSON chart AST |
| `canonical` | One JSON canonical chord struct per cell (stdout lines) |
| `html` | Engraved HTML fragment (pair with ChordFont + `@chordlang/render/chart.css`) |

## Example

```bash
chordlang html examples/charts/blues-in-f.cfmd > chart.html
```

## Links

- [chordlang monorepo](https://github.com/borkxs/chordlang)
