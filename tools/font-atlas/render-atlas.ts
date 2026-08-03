#!/usr/bin/env node
/**
 * Headless ChordFont atlas — every supported symbol × every root spelling.
 *
 * Renders a single HTML proof page and a full-page PNG for font iteration
 * (human review or agent visual diffing). Uses the same Playwright + inlined
 * TTF pipeline as scripts/render-previews.ts.
 *
 * Usage:
 *   make font-atlas
 *   node --experimental-strip-types tools/font-atlas/render-atlas.ts
 *   node --experimental-strip-types tools/font-atlas/render-atlas.ts --out /tmp/atlas
 *
 * Requires: Node 22+, ChordFont Real Book TTF, Playwright chromium (`make setup`).
 */
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { SYMBOL_GROUPS, ROOTS, buildAtlasEntries, buildUniqueSymbols, type AtlasEntry } from "./catalog.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const DEFAULT_FONT = join(ROOT, "packages/font/dist/ChordFont-Real Book.ttf");
const DEFAULT_OUT = join(ROOT, "packages/font/dist");

function parseArgs(argv: string[]) {
  let outDir = DEFAULT_OUT;
  let fontPath = DEFAULT_FONT;
  let htmlOnly = false;
  let pngOnly = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--out" && argv[i + 1]) outDir = resolve(argv[++i]);
    else if (arg === "--font" && argv[i + 1]) fontPath = resolve(argv[++i]);
    else if (arg === "--html-only") htmlOnly = true;
    else if (arg === "--png-only") pngOnly = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: render-atlas.ts [--out DIR] [--font TTF] [--html-only] [--png-only]`);
      process.exit(0);
    }
  }

  return { outDir, fontPath, htmlOnly, pngOnly };
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderCell(entry: AtlasEntry): string {
  return `<div class="cell">
  <div class="sym">${escapeHtml(entry.symbol)}</div>
  <div class="lbl">${escapeHtml(entry.symbol)}</div>
</div>`;
}

function renderAtlasHtml(entries: AtlasEntry[], fontBase64: string, fontLabel: string): string {
  const byGroup = new Map<string, AtlasEntry[]>();
  for (const entry of entries) {
    const list = byGroup.get(entry.group) ?? [];
    list.push(entry);
    byGroup.set(entry.group, list);
  }

  const sections = SYMBOL_GROUPS.map((group) => {
    const groupEntries = byGroup.get(group.name) ?? [];
    if (groupEntries.length === 0) return "";
    const cells = groupEntries.map(renderCell).join("\n");
    const suffixNote = group.suffixes.map((s) => s || "(triad)").join(", ");
    return `<section class="group">
  <h2>${escapeHtml(group.name)}</h2>
  <p class="suffixes">${escapeHtml(suffixNote)}</p>
  <div class="grid">${cells}</div>
</section>`;
  }).join("\n");

  const symbolCount = new Set(entries.map((e) => e.symbol)).size;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>ChordFont Atlas</title>
<style>
@font-face {
  font-family: "ChordFont";
  src: url("data:font/ttf;base64,${fontBase64}") format("truetype");
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #2a2a2a;
  color: #e8e8e8;
  padding: 1.5rem 1.75rem 2.5rem;
}
header { margin-bottom: 1.25rem; }
h1 { font-size: 1.15rem; font-weight: 600; letter-spacing: -0.02em; }
.meta { font-size: 0.75rem; color: #999; margin-top: 0.35rem; line-height: 1.5; }
.group { margin-bottom: 1.75rem; }
.group h2 {
  font-size: 0.85rem;
  font-weight: 600;
  color: #ccc;
  margin-bottom: 0.25rem;
  border-bottom: 1px solid #444;
  padding-bottom: 0.35rem;
}
.suffixes {
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 0.62rem;
  color: #777;
  margin-bottom: 0.6rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr));
  gap: 0.45rem;
}
.cell {
  background: #faf8f2;
  color: #1a1815;
  border-radius: 4px;
  padding: 0.55rem 0.35rem 0.45rem;
  text-align: center;
  min-height: 3.4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.sym {
  font-family: "ChordFont", ui-sans-serif, serif;
  font-feature-settings: "liga" 1, "calt" 1;
  font-size: 1.35rem;
  line-height: 1.25;
  letter-spacing: 0;
}
.lbl {
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 0.48rem;
  color: #888;
  margin-top: 0.25rem;
  word-break: break-all;
  line-height: 1.2;
}
</style>
</head>
<body>
<header>
  <h1>ChordFont Atlas</h1>
  <p class="meta">
    ${escapeHtml(fontLabel)} · ${ROOTS.length} roots · ${symbolCount} unique symbols ·
    ${entries.length} cells · ligatures on (<code>liga</code>, <code>calt</code>)
  </p>
</header>
${sections}
</body>
</html>`;
}

async function main() {
  const { outDir, fontPath, htmlOnly, pngOnly } = parseArgs(process.argv.slice(2));

  if (!(await exists(fontPath))) {
    console.error(`Missing font: ${fontPath}\nRun 'make font' first.`);
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });

  const entries = buildAtlasEntries();
  const fontBase64 = (await readFile(fontPath)).toString("base64");
  const fontLabel = fontPath.replace(ROOT + "/", "");
  const html = renderAtlasHtml(entries, fontBase64, fontLabel);

  const htmlPath = join(outDir, "atlas.html");
  const pngPath = join(outDir, "atlas.png");
  const jsonPath = join(outDir, "atlas-symbols.json");

  const manifest = {
    font: fontPath,
    roots: [...ROOTS],
    groups: SYMBOL_GROUPS.map((g) => ({ name: g.name, suffixes: [...g.suffixes] })),
    symbols: buildUniqueSymbols(),
    entries: entries.map(({ symbol, group, suffix, root }) => ({ symbol, group, suffix, root })),
  };

  if (!pngOnly) {
    await writeFile(jsonPath, JSON.stringify(manifest, null, 2), "utf8");
    await writeFile(htmlPath, html, "utf8");
    console.log(`Wrote ${jsonPath}`);
    console.log(`Wrote ${htmlPath}`);
  }

  if (!htmlOnly) {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({ deviceScaleFactor: 2 });
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      await page.evaluate(async () => {
        await document.fonts.ready;
        const chordFont = [...document.fonts].find((f) => f.family === "ChordFont");
        if (chordFont?.status === "error") {
          throw new Error("ChordFont failed to load");
        }
      });
      await page.locator("body").screenshot({ path: pngPath, type: "png", fullPage: true });
      console.log(`Wrote ${pngPath}`);
    } finally {
      await browser.close();
    }
  }

  const unique = new Set(entries.map((e) => e.symbol)).size;
  console.log(`\n${unique} unique symbols across ${SYMBOL_GROUPS.length} groups × ${ROOTS.length} roots`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
