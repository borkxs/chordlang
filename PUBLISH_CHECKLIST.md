# Publish checklist

Track what’s left before npm packages and a full v0.1 release. Public GitHub
repo and GitHub Pages playground are **live**; npm publish and CI gates remain.

**Live demo:** https://borkxs.github.io/chordlang

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

- [ ] Adopt target package map (rename/refactor incrementally; don’t block v0.1 on all of it):

  | Target npm name        | Role today                         | Notes                          |
  |------------------------|------------------------------------|--------------------------------|
  | `@chordlang/parser`    | `@chordlang/parse`                 | rename when publishing         |
  | `@chordlang/render`    | `@chordlang/render`                | ✓ name already right           |
  | `@chordlang/graph`     | graph demo + `render-graphs.ts`    | extract from playground        |
  | `@chordlang/analyze`   | —                                  | future harmonic analysis       |
  | `@chordlang/font`      | `packages/font` (Python build)     | ships ChordFont TTF + OFL      |
  | `@chordlang/cli`       | `@chordlang/cli`                   | ✓; point at `.cfmd` / `.cfgv`  |
  | (internal)             | `@chordlang/chord`                 | canonical normalizer; keep or fold into parser |

- [ ] Decide whether `@chordlang/chord` stays separate or merges into `@chordlang/parser` / `@chordlang/analyze`.
- [ ] Audit copy (README, CODEBASE, playground UI) — lead with **structured notation pipeline**, not “a clever chord font”. *(README improved; playground tagline still font-forward.)*
- [x] Consistent extension story: `.cfmd` (charts), `.cfgv` (graphs); document in spec/README.
- [ ] Register npm org `@chordlang` (or confirm scoped publish under personal account).

---

## GitHub repo

- [x] Create public GitHub repo `chordlang` — `borkxs/chordlang` on GitHub.
- [x] Add `LICENSE` at repo root (MIT for JS; separate OFL notice for ChordFont in `packages/font/`).
- [ ] Add `CONTRIBUTING.md` (dev setup: Node 22 via `.nvmrc`, `make setup`, `make test`).
- [ ] Add issue templates / PR template (optional but helpful once public).
- [ ] Pin description + topics: `music`, `chord-charts`, `lead-sheet`, `graphviz`, `open-type`, `jazz`.
- [ ] Enable GitHub Discussions or link to issues for format questions (optional).
- [x] `.gitignore` audit — `dist/`, `node_modules/`, generated parser, `.DS_Store` covered.
- [ ] Remove or redact anything that shouldn’t be public (credentials, local paths, WIP notes). *(Quick pass still worthwhile.)*

---

## npm publish

All items still open — packages remain `"private": true`; root has `"packageManager": "pnpm@9.15.9"`.

- [ ] Set `"private": false` and proper `"files"` / `"exports"` on each publishable package.
- [ ] Ensure packages ship **built** `dist/`, not `src/` (today dev aliases point at source; publishConfig exists but verify `pnpm build` output).
- [ ] Add `"repository"`, `"homepage"`, `"bugs"`, `"license"`, `"author"` to each `package.json`.
- [ ] Align versions across packages (`0.1.0` → first tagged release `v0.1.0`).
- [ ] Add `"prepublishOnly": "pnpm run build"` (or use Changesets / pnpm publish filter).
- [ ] Publish order: `@chordlang/parser` (or parse) → `@chordlang/render` → `@chordlang/cli` → `@chordlang/font` (if npm ships TTF).
- [ ] Decide font distribution: npm tarball with `ChordProof.ttf`, separate GitHub release asset, or both.
- [ ] Document consumer install:

  ```bash
  npm install @chordlang/render @chordlang/parser
  # + @font-face for ChordFont or import from @chordlang/font
  ```

- [ ] Smoke-test `npm pack` / `npm install` from a temp directory outside the monorepo.
- [ ] Tag release and publish with provenance (npm trusted publishing / GitHub Actions OIDC).

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
- [ ] README badges (CI / Pages) — link only; no shield badges yet.

---

## CI / quality gate

Pages deploy workflow exists; test/lint/preview gates do not.

- [ ] GitHub Actions workflow: `make setup` → `make test` → `make lint` on PR + `main`.
- [ ] CI job: `make previews` and fail if `docs/assets/` drift (or auto-commit previews bot — pick one policy).
- [ ] CI job: `make font` + font shape tests (`packages/font`) on Python matrix (optional separate workflow).
- [x] Node version pinned — `.nvmrc` → 22; Pages workflow uses `node-version-file: .nvmrc`.
- [x] Cache pnpm store in CI — Pages workflow uses `cache: pnpm`.
- [ ] Branch protection: require CI green before merge.

---

## Documentation

- [x] README hero — font / chart / graph sections with embedded preview PNGs (not a pipeline diagram).
- [x] Prior art, dependencies, and related links in README.
- [ ] Expand README with “Install from npm” section once packages ship.
- [x] `examples/README.md` — exists; linked from main README; documents routes and preview workflow.
- [x] `docs/readme-previews.md` — maintainer doc for regenerating README PNGs.
- [ ] Format spec page: point to `packages/parse/src/chart.peggy` + human-readable spec (consider `docs/spec.md` generated or maintained alongside grammar). *(Grammar linked from README; no standalone spec page.)*
- [ ] ChordFont page: how GSUB engraving works, OFL attribution, link to `packages/font/README.md`. *(Brief README section + `packages/font/README.md` exist; no dedicated docs page.)*
- [ ] CHANGELOG.md (Keep a Changelog format) starting at `v0.1.0`.
- [x] CODEBASE.md — exists; reflects current package map.
- [x] ADR index — `DECISIONS.md` exists.
- [ ] Add ADR for publish scope and package naming when decided.

---

## Legal & assets

- [x] Root `LICENSE` (MIT) for TypeScript tooling and grammar.
- [x] `packages/font/NOTICE` + OFL for ChordFont — present; verify shipped TTF bundles required license text on npm/release.
- [x] Credit Petaluma / Steinberg per OFL in README.
- [ ] Confirm tonal (MIT) attribution in third-party notices if required.
- [ ] Trademark note: “chordlang” and “ChordFont” — no registration needed for OSS, but avoid implying endorsement by iReal / Real Book etc.

---

## Pre-launch smoke test

- [ ] Fresh clone → `make setup` → `make test` → `make dev` (chart + graph demos work).
- [ ] Fresh clone → `make previews` → README images match committed `docs/assets/`.
- [ ] CLI: `chordlang html examples/charts/blues-in-f.cfmd` produces valid HTML with ChordFont classes.
- [ ] Published npm packages work in a minimal HTML page or StackBlitz repro. *(blocked on npm publish)*
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
