# Contributing

Thanks for helping improve chordlang. This repo is a pnpm monorepo with TypeScript
packages, a Python font build, and a Vite playground.

## Prerequisites

- **Node.js 22** — use [nvm](https://github.com/nvm-sh/nvm) with the repo `.nvmrc`
  (`nvm install` / `nvm use`). Needed for `make lookbook`, `make font-atlas`, and
  `make previews` (`node --experimental-strip-types`).
- **pnpm 9** — enabled via Corepack (`corepack enable`) or install from npm
- **Python 3.11+** — only if you rebuild ChordFont (`make font`)

## Setup

```bash
git clone https://github.com/borkxs/chordlang.git
cd chordlang
make setup    # pnpm install + Playwright chromium (for preview screenshots)
```

## Common tasks

| Command | Purpose |
|---------|---------|
| `make dev` | Live playground — edit `.cfmd` text, watch engraved output |
| `make test` | Vitest across packages (grammar rebuilt first) |
| `make lint` | Typecheck all packages |
| `make build` | Build package `dist/` outputs |
| `make grammar` | Regenerate Peggy parser from `packages/parser/src/chart.peggy` |
| `make cli CMD='html examples/charts/blues-in-f.cfmd'` | CLI smoke test (after `make build`) |
| `make previews` | Regenerate README preview PNGs under `docs/assets/` |
| `make font` | Rebuild ChordFont TTF (Python, `packages/font/`) |
| `make font-atlas` | Exhaustive ChordFont symbol proof sheet (PNG + HTML + JSON) |
| `make lookbook` | Reference-vs-live ChordFont look book (`tools/lookbook/`) |
| `make help` | List every Makefile target |

## Editing examples

Chart sources live in `examples/charts/*.cfmd`, graphs in `examples/graphs/*.cfgv`.
See [`examples/README.md`](examples/README.md) for the manifest, playground routes,
and when to re-run `make previews`.

If you change anything affecting README preview images (example sources, `chart.css`,
ChordFont, or rendering scripts), regenerate `docs/assets/` for documentation:

```bash
./scripts/docker-previews.sh  # Pinned environment
# OR
make previews                  # Local environment (faster, may differ)
```

**Note:** Preview images are documentation artifacts, not tests. Font correctness
is validated by shape tests in `packages/font/tests/`. See
[`docs/readme-previews.md`](docs/readme-previews.md).

## ChordFont iteration

When editing glyph outlines or GSUB rules (`packages/font/`), use both visual
feedback loops:

1. **Look book** — side-by-side reference crops / LilyPond / LilyJAZZ / Petaluma
   vs live ChordFont: change sources → `make lookbook` → open
   `tools/lookbook/lookbook.html`. See [`tools/lookbook/README.md`](tools/lookbook/README.md).
2. **Atlas** — exhaustive roots × suffixes matrix: `make font-atlas` → inspect
   `packages/font/dist/atlas.png`. See [`tools/font-atlas/README.md`](tools/font-atlas/README.md).

Shaping regressions are caught by `make -C packages/font test` (`tests/shape_test.py`).

## Project layout

[`CODEBASE.md`](CODEBASE.md) describes the parse → normalize → render pipeline and
each package's role. Architecture decisions are in [`DECISIONS.md`](DECISIONS.md).

## Pull requests

1. Branch from `main`.
2. Run `make test` and `make lint` locally (CI runs the same).
3. If preview assets may have changed, run `make previews` and include updated PNGs.
4. Keep commits focused; link related issues when applicable.

CI must pass before merge.

## Releasing

Packages are published to npm as `@chordlang/*` (currently `0.1.1`). To cut a
release:

1. Bump version in each affected `packages/*/package.json`.
2. Add a dated section to [`CHANGELOG.md`](CHANGELOG.md).
3. Tag (`git tag v0.1.2`) and push — [`.github/workflows/publish.yml`](.github/workflows/publish.yml) publishes on `v*` tags.

Remaining release housekeeping (OIDC trusted publishing, consumer smoke tests,
semver automation) is tracked in [`PUBLISH_CHECKLIST.md`](PUBLISH_CHECKLIST.md).

## License

TypeScript tooling and grammar: MIT (`LICENSE`). ChordFont: SIL Open Font License
— see `packages/font/NOTICE`.
