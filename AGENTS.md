# AGENTS.md

`chordlang` is a pnpm monorepo for engraving jazz chord symbols/charts. See
[`README.md`](README.md), [`CONTRIBUTING.md`](CONTRIBUTING.md), and
[`CODEBASE.md`](CODEBASE.md) for the full picture. Standard commands live in the
[`Makefile`](Makefile) and root [`package.json`](package.json).

## Cursor Cloud specific instructions

- Toolchain (Node 22, pnpm 9.15.9, Python 3.12) is already present; the startup
  update script runs `pnpm install`. Generated code (`packages/parser/src/generated/`)
  and `dist/` are gitignored and are recreated by the build/dev/test scripts, so
  they will not exist on a fresh checkout.
- **Build before `pnpm run test` / `pnpm run lint`.** The root `test` and `lint`
  scripts do NOT build packages first, and `@chordlang/render` + `@chordlang/cli`
  resolve their workspace deps (`@chordlang/parser`, `@chordlang/chord`) via each
  package's built `dist/`. Running those scripts on a clean tree fails with
  "Cannot find module '@chordlang/parser'". Prefer `make test` / `make build &&
  make lint` (Makefile `test` depends on `build`), or run `pnpm run build` once
  first. This does not apply to `make dev`, which aliases `@chordlang/*` to source.
- Playground (the main interactive app): `make dev` (or `pnpm run dev`) serves the
  Vite app at http://localhost:5173. `dev` auto-runs grammar generation; no prior
  package build is required for the playground.
- CLI headless smoke test (needs a prior build):
  `node packages/cli/dist/index.js html examples/charts/blues-in-f.cfmd`.
- The ChordFont Python build (`make font`) is OPTIONAL — a prebuilt
  `apps/playground/public/fonts/ChordProof.ttf` is committed, so engraving works
  without it. Playwright chromium is only needed for `make previews` (README
  screenshot regeneration); install on demand with
  `pnpm exec playwright install chromium`.
