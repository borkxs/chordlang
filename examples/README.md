# Examples

Source-of-truth examples for the playground, CLI, and README previews.

## Formats

| Extension | Name | Spec |
|-----------|------|------|
| `.txt` | font symbol strip | Plain ASCII chord tokens — README font preview only |
| `.cfmd` | chord font markdown | `packages/parser/src/chart.peggy` — lead-sheet chart structure |
| `.cfgv` | chord font graphviz | Standard [Graphviz DOT](https://graphviz.org/doc/info/lang.html); node labels use `fontname="ChordFont"` |

`manifest.json` has two roles:

- **`readme`** — which files the root README embeds (source text + PNG must match).
- **`charts` / `graphs`** — playground chip order and full preview output list.

## Edit workflow

1. Edit a file under `font/`, `charts/`, or `graphs/`.
2. `make dev` — playground loads chart/graph examples via Vite glob (live, no screenshot).
3. If the visual output changed, regenerate `docs/assets/` and commit the PNGs:
   ```bash
   ./scripts/docker-previews.sh  # Recommended: matches CI exactly
   # OR
   make previews                  # Alternative: may differ from CI
   ```
   See [`docs/readme-previews.md`](../docs/readme-previews.md) for the full checklist.

**CI checks:**

- **`preview-drift`** (Docker): Ensures committed previews match current code.
  Catches "forgot to run preview generation" mistakes. Fails on any difference.
- **`preview-cross-platform`** (macOS, Windows): Tests rendering consistency.
  Reports platform differences (informational; future work will add threshold).

**Docker workflow:** The Docker script builds a container with the exact
environment used in CI (pinned Node, Debian, system libraries). This guarantees
byte-for-byte identical PNGs, eliminating false CI failures from environment
differences.

Each manifest `file` slug is a playground route:

- Charts: `/chart/walkin-thing`, `/chart/giant-steps`, …
- Graphs: `/graph/ii-v-i-chain`, `/graph/giant-steps`, …

When a slug exists in both lists (e.g. `giant-steps`), the nav shows a **chart →** / **graph →** link to the matching peer.

Graph DOT is passed straight to Graphviz; chordlang only post-styles the SVG
(ChordFont on `<text>`). Charts go through parse → normalize → render → screenshot.
