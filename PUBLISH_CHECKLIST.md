# Publish checklist

Track remaining polish after the **v0.1.1** npm release. Public GitHub repo,
GitHub Pages playground, CI gates, and all six `@chordlang/*` packages are
**live** on npm.

**Live demo:** https://borkxs.github.io/chordlang · **Latest npm:** `0.1.1`

---

## Branding & naming

**Project:** `chordlang` (lowercase) — the language, parser, renderer, and analysis pipeline.

**Font:** `ChordFont` (PascalCase) — the engraving font; a component inside chordlang, not the whole product story.

**Pipeline (the pitch):**

```
chordlang source (.cfmd / .cfgv)
  → AST
  → canonical form
  → chart renderer
  → harmonic analyzer   (future)
  → graph renderer
```

- [x] Adopt target package map (rename/refactor incrementally; don’t block v0.1 on all of it):

  | Target npm name        | Directory            | Status                         |
  |------------------------|----------------------|--------------------------------|
  | `@chordlang/parser`    | `packages/parser`    | ✓ published `0.1.1`            |
  | `@chordlang/render`    | `packages/render`    | ✓ published `0.1.1`            |
  | `@chordlang/graph`     | `packages/graph`     | ✓ published `0.1.1`            |
  | `@chordlang/analyze`   | —                    | future harmonic analysis       |
  | `@chordlang/font`      | `packages/font`      | ✓ published `0.1.1`            |
  | `@chordlang/cli`       | `packages/cli`       | ✓ published `0.1.1`            |
  | `@chordlang/chord`     | `packages/chord`     | ✓ published `0.1.1` (ADR-006)  |

- [x] Decide whether `@chordlang/chord` stays separate or merges into `@chordlang/parser` / `@chordlang/analyze`. *(ADR-006: keep separate for v0.1; revisit when `@chordlang/analyze` lands.)*
- [x] Audit copy (README, CODEBASE, playground UI) — lead with **structured notation pipeline**, not “a clever chord font”.
- [x] Consistent extension story: `.cfmd` (charts), `.cfgv` (graphs); document in spec/README.
- [x] Register npm org `@chordlang` — org exists; `borkxs` owner; scoped packages published public.

---

## GitHub repo

- [x] Create public GitHub repo `chordlang` — `borkxs/chordlang` on GitHub.
- [x] Add `LICENSE` at repo root (MIT for JS; separate OFL notice for ChordFont in `packages/font/`).
- [x] Add `CONTRIBUTING.md` (dev setup: Node 22 via `.nvmrc`, `make setup`, `make test`).
- [x] Add issue templates / PR template (optional but helpful once public).
- [x] Pin description + topics: `music`, `chord-charts`, `lead-sheet`, `graphviz`, `open-type`, `jazz`.
- [ ] Enable GitHub Discussions or link to issues for format questions (optional).
- [x] `.gitignore` audit — `dist/`, `node_modules/`, generated parser, `.DS_Store` covered.
- [x] Remove or redact anything that shouldn’t be public (credentials, local paths, WIP notes).

---

## npm publish

Root `"packageManager": "pnpm@9.15.9"`. Publish workflow: `.github/workflows/publish.yml`
(tags `v*` or manual dispatch; dependency order in the workflow).

- [x] Set `"private": false` and proper `"files"` / `"exports"` on each publishable package.
- [x] Ensure packages ship **built** `dist/`, not `src/` (playground Vite aliases still point at source for dev).
- [x] Add `"repository"`, `"homepage"`, `"bugs"`, `"license"`, `"author"` to each `package.json`.
- [x] Align versions across packages — currently `0.1.1`; tagged `v0.1.0` and `v0.1.1`.
- [x] Add `"prepublishOnly": "pnpm run build"` on TS packages (font ships committed TTF).
- [x] Publish order: `@chordlang/parser` → `@chordlang/chord` → `@chordlang/render` → `@chordlang/graph` → `@chordlang/cli` → `@chordlang/font` (automated in `publish.yml`).
- [x] Decide font distribution: npm tarball with `ChordProof.ttf` (+ playground copy for Pages).
- [x] Document consumer install — root README “Install from npm” + per-package READMEs on npm.
- [ ] Smoke-test `npm pack` / `npm install` from a temp directory outside the monorepo. *(`npm pack` verified for `@chordlang/render`; full install-from-tarball pending.)*
- [x] Tag release and publish — `v0.1.0` / `v0.1.1` via GitHub Actions + `NPM_TOKEN`.
- [ ] Switch to npm trusted publishing (OIDC); remove `NPM_TOKEN` secret. *(Workflow has `id-token: write`; configure per-package trusted publishers on npm.)*

---

## Demo site (GitHub Pages)

- [x] Choose hosting path — **Option B:** GitHub Actions artifact → Pages (`.github/workflows/pages.yml`).
- [x] Set Vite `base: '/chordlang/'` when `GITHUB_PAGES=true` so assets resolve.
- [x] Build pipeline — grammar + playground build; font ships as committed snapshot in `apps/playground/public/fonts/` (no Python in CI).
- [x] Include graph demo and link from chart page (header link + routable `/graph/:slug`).
- [x] Routable examples — `/chart/:slug` and `/graph/:slug` from `manifest.json`; peer links when slug exists in both lists.
- [ ] Optionally publish `examples/` gallery page or static graph index from `make graphs` output.
- [x] Verify ChordFont loads on Pages (bundled font in CSS; production `@import` order fixed).
- [x] Add live demo URL to README — https://borkxs.github.io/chordlang
- [ ] Custom domain (optional): `chordlang.dev` or similar.
- [x] README badges (CI / Pages) — link only; no shield badges yet.

---

## CI / quality gate

`.github/workflows/ci.yml` runs test/lint and preview drift on PR + `main`.
`.github/workflows/pages.yml` deploys the playground on push to `main`.

- [x] GitHub Actions workflow: `make test` → `make lint` on PR + `main` (`.github/workflows/ci.yml`).
- [x] Font correctness validated by shape tests (`packages/font/tests/shape_test.py`) — runs in CI, catches regressions.
- [x] CI job: cross-platform preview generation check (macOS, Windows; informational, ensures tooling works).
- [x] Manual workflow: generate-previews.yml for bulk preview regeneration (Docker, can commit back).
- [x] Docker-based preview generation for local development (`./scripts/docker-previews.sh`).
- [ ] CI job: `make font` + font shape tests (`packages/font`) on Python matrix (optional separate workflow).
- [x] Node version pinned — `.nvmrc` → 22; CI and Pages workflows use `node-version-file: .nvmrc`.
- [x] Cache pnpm store in CI — `cache: pnpm` in `ci.yml` and `pages.yml`.
- [ ] Branch protection: require CI green before merge.

---

## Documentation

- [x] README hero — font / chart / graph sections with embedded preview PNGs (not a pipeline diagram).
- [x] Prior art, dependencies, and related links in README.
- [x] README “Install from npm” section with package links and minimal consumer pipeline.
- [x] `examples/README.md` — exists; linked from main README; documents routes and preview workflow.
- [x] `docs/readme-previews.md` — maintainer doc for regenerating README PNGs.
- [ ] Format spec page: point to `packages/parser/src/chart.peggy` + human-readable spec (consider `docs/spec.md` generated or maintained alongside grammar). *(Grammar linked from README; no standalone spec page.)*
- [ ] ChordFont page: how GSUB engraving works, OFL attribution, link to `packages/font/README.md`. *(Brief README section + `packages/font/README.md` exist; no dedicated docs page.)*
- [x] CHANGELOG.md (Keep a Changelog format) — `v0.1.0` and `v0.1.1` dated 2026-07-05.
- [x] CODEBASE.md — exists; reflects current package map and npm publish path.
- [x] ADR index — `DECISIONS.md` exists.
- [x] Add ADR for publish scope and package naming when decided. *(ADR-006.)*

---

## Legal & assets

- [x] Root `LICENSE` (MIT) for TypeScript tooling and grammar.
- [x] `packages/font/NOTICE` + OFL for ChordFont — present; shipped TTF bundles `NOTICE` on npm.
- [x] Credit Petaluma / Steinberg per OFL in README.
- [x] Confirm tonal (MIT) attribution in third-party notices if required. *(README deps table + `THIRD_PARTY_NOTICES.md`.)*
- [x] Trademark note: “chordlang” and “ChordFont” — no registration needed for OSS, but avoid implying endorsement by iReal / Real Book etc.

---

## Pre-launch smoke test

- [x] Fresh clone → `make setup` → `make test` → `make lint` verified locally.
- [ ] Fresh clone → `make previews` → README images match committed `docs/assets/`.
- [x] CLI: `chordlang html examples/charts/blues-in-f.cfmd` produces valid HTML with ChordFont classes.
- [ ] Published npm packages work in a minimal HTML page or StackBlitz repro.
- [x] GitHub Pages demo loads chart playground and graph demo (manual verify after deploy).
- [ ] Social preview: add `docs/assets/og.png` or reuse `blues-in-f.png` for Open Graph image meta (optional).

---

## Post-launch (nice to have)

- [ ] npm download badge, CI badge, Pages demo badge in README.
- [ ] `@chordlang/analyze` — harmonic analysis from AST / canonical form.
- [ ] `@chordlang/graph` — programmatic graph builder (not just raw DOT).
- [ ] VS Code / Cursor extension: `.cfmd` syntax highlight.
- [ ] `tools/corpus` — McGill/Weimar frequency mining (already stubbed).
- [ ] Changesets or release-please for semver automation.
- [ ] Dedicated font preview route on Pages (e.g. `/font/readme-symbols`) — README still uses committed PNG for inline GitHub render.
