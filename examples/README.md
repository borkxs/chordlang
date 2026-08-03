# Examples

Source-of-truth examples for the playground, CLI, and README previews.

## Formats

| Extension | Name | Spec |
|-----------|------|------|
| `.txt` | font symbol strip | Plain ASCII chord tokens — README font preview only |
| `.cfmd` | chord font markdown | `packages/parser/src/chart.peggy` — lead-sheet chart structure |
| `.cfgv` | chord font graphviz | Standard [Graphviz DOT](https://graphviz.org/doc/info/lang.html); node labels use `fontname="ChordFont"` |

[`integrations/`](integrations/) holds runnable sources for third-party tools
that engrave ChordFont for free via their shaping engines (LaTeX, Typst,
LilyPond) — not part of the playground/preview pipeline. See
[`docs/font-integrations.md`](../docs/font-integrations.md).

`manifest.json` has two roles:

- **`readme`** — which files the root README embeds (source text + PNG must match).
- **`charts` / `graphs`** — playground example order (optional `group` for the
  picker sections) and full preview output list.

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

**Preview generation:**

Preview images are **documentation artifacts** for README/publishing, not tests.
Font correctness is validated by shape tests (`packages/font/tests/`).

- **Local:** `./scripts/docker-previews.sh` (pinned environment)
- **CI:** `preview-cross-platform` job verifies generation works on all platforms
- **Manual trigger:** `.github/workflows/generate-previews.yml` for bulk updates

The Docker script ensures consistent rendering across environments, though
minor pixel differences are acceptable since previews are for documentation.

Each manifest `file` slug is a playground route:

- Charts: `/chart/walkin-thing`, `/chart/giant-steps`, …
- Graphs: `/graph/ii-v-i-chain`, `/graph/giant-steps`, …

Charts and graphs share one playground; pick either kind from the grouped
example dropdown (Jazz / Pop / Fixtures / Graphs). Routes stay
`/chart/:slug` and `/graph/:slug` so examples remain deep-linkable.

Graph DOT is passed straight to Graphviz; chordlang only post-styles the SVG
(ChordFont on `<text>`). Charts go through parse → normalize → render → screenshot.
