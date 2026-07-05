# Contributing

Thanks for helping improve chordlang. This repo is a pnpm monorepo with TypeScript
packages, a Python font build, and a Vite playground.

## Prerequisites

- **Node.js 22** — use [nvm](https://github.com/nvm-sh/nvm) with the repo `.nvmrc`
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
| `make help` | List every Makefile target |

## Editing examples

Chart sources live in `examples/charts/*.cfmd`, graphs in `examples/graphs/*.cfgv`.
See [`examples/README.md`](examples/README.md) for the manifest, playground routes,
and when to re-run `make previews`.

If you change anything that affects README preview images (source text, `chart.css`,
ChordFont, or `scripts/render-previews.ts`), run `make previews` and commit
`docs/assets/` alongside your source changes. See
[`docs/readme-previews.md`](docs/readme-previews.md).

## Project layout

[`CODEBASE.md`](CODEBASE.md) describes the parse → normalize → render pipeline and
each package's role. Architecture decisions are in [`DECISIONS.md`](DECISIONS.md).

## Pull requests

1. Branch from `main`.
2. Run `make test` and `make lint` locally (CI runs the same).
3. If preview assets may have changed, run `make previews` and include updated PNGs.
4. Keep commits focused; link related issues when applicable.

CI must pass before merge. The publish roadmap lives in
[`PUBLISH_CHECKLIST.md`](PUBLISH_CHECKLIST.md).

## License

TypeScript tooling and grammar: MIT (`LICENSE`). ChordFont: SIL Open Font License
— see `packages/font/NOTICE`.
