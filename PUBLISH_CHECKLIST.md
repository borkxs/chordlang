# Publish checklist

Track what’s left before a public GitHub repo, npm packages, and a live demo
(probably GitHub Pages). Check items off as they land.

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
- [ ] Audit copy (README, CODEBASE, playground UI) — lead with **structured notation pipeline**, not “a clever chord font”.
- [ ] Consistent extension story: `.cfmd` (charts), `.cfgv` (graphs); document in spec/README.
- [ ] Register npm org `@chordlang` (or confirm scoped publish under personal account).

---

## GitHub repo

- [ ] Create public GitHub repo `chordlang` (or transfer existing private repo).
- [ ] Add `LICENSE` at repo root (MIT for JS packages; confirm OFL for ChordFont / Petaluma derivative — may need dual notice or `LICENSE` + `packages/font/OFL`).
- [ ] Add `CONTRIBUTING.md` (dev setup: Node 22 via `.nvmrc`, `make setup`, `make test`).
- [ ] Add issue templates / PR template (optional but helpful once public).
- [ ] Pin description + topics: `music`, `chord-charts`, `lead-sheet`, `graphviz`, `open-type`, `jazz`.
- [ ] Enable GitHub Discussions or link to issues for format questions (optional).
- [ ] `.gitignore` audit — ✓ `.DS_Store`; confirm `dist/`, `node_modules/`, generated parser are ignored.
- [ ] Remove or redact anything that shouldn’t be public (credentials, local paths, WIP notes).

---

## npm publish

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

- [ ] Choose hosting path:
  - **Option A:** `gh-pages` branch — `apps/playground` Vite build → `/` or `/chordlang/`
  - **Option B:** GitHub Actions artifact → Pages (recommended; rebuild on push to `main`)
- [ ] Set Vite `base: '/chordlang/'` (or custom domain) so assets resolve.
- [ ] Build pipeline: `make font` (or commit font snapshot) → `pnpm build` playground → deploy `dist/`.
- [ ] Include graph demo (`graph.html`) and link from main page — ✓ already linked.
- [ ] Optionally publish `examples/` gallery page or static graph index from `make graphs` output.
- [ ] Verify ChordFont loads on Pages (TTF in `public/fonts/`, correct base path).
- [ ] Add live demo URL to README badge / header once deployed.
- [ ] Custom domain (optional): `chordlang.dev` or similar.

---

## CI / quality gate

- [ ] GitHub Actions workflow: `make setup` → `make test` → `make lint` on PR + `main`.
- [ ] CI job: `make previews` and fail if `docs/assets/` drift (or auto-commit previews bot — pick one policy).
- [ ] CI job: `make font` + font shape tests (`packages/font`) on Python matrix (optional separate workflow).
- [ ] Node version matrix: pin to 22 (matches `.nvmrc`).
- [ ] Cache pnpm store in CI.
- [ ] Branch protection: require CI green before merge.

---

## Documentation

- [ ] README hero: pipeline diagram + embedded previews — ✓ partial (two example images).
- [ ] Expand README with “Install from npm” section once packages ship.
- [ ] `examples/README.md` — ✓ exists; link from main README.
- [ ] Format spec page: point to `packages/parse/src/chart.peggy` + human-readable spec (consider `docs/spec.md` generated or maintained alongside grammar).
- [ ] ChordFont page: how GSUB engraving works, OFL attribution, link to `packages/font/README.md`.
- [ ] CHANGELOG.md (Keep a Changelog format) starting at `v0.1.0`.
- [ ] CODEBASE.md — ✓ exists; update as packages are renamed/extracted.
- [ ] ADR index — ✓ `DECISIONS.md`; add ADR for publish scope and package naming when decided.

---

## Legal & assets

- [ ] Root `LICENSE` (MIT) for TypeScript tooling and grammar.
- [ ] `packages/font/NOTICE` + OFL for ChordFont — ✓ partial; ensure shipped TTF includes required license files.
- [ ] Credit Petaluma / Steinberg per OFL in README and font package.
- [ ] Confirm tonal (MIT) attribution in third-party notices if required.
- [ ] Trademark note: “chordlang” and “ChordFont” — no registration needed for OSS, but avoid implying endorsement by iReal / Real Book etc.

---

## Pre-launch smoke test

- [ ] Fresh clone → `make setup` → `make test` → `make dev` (chart + graph demos work).
- [ ] Fresh clone → `make previews` → README images match committed `docs/assets/`.
- [ ] CLI: `chordlang html examples/charts/blues-in-f.cfmd` produces valid HTML with ChordFont classes.
- [ ] Published npm packages work in a minimal HTML page or StackBlitz repro.
- [ ] GitHub Pages demo loads both playground entry points.
- [ ] Social preview: add `docs/assets/og.png` or reuse `blues-in-f.png` for Open Graph image meta (optional).

---

## Post-launch (nice to have)

- [ ] npm download badge, CI badge, Pages demo badge in README.
- [ ] `@chordlang/analyze` — harmonic analysis from AST / canonical form.
- [ ] `@chordlang/graph` — programmatic graph builder (not just raw DOT).
- [ ] VS Code / Cursor extension: `.cfmd` syntax highlight.
- [ ] `tools/corpus` — McGill/Weimar frequency mining (already stubbed).
- [ ] Changesets or release-please for semver automation.
