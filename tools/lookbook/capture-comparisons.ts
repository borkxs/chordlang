#!/usr/bin/env node
/**
 * Capture lookbook comparison screenshots for glyph tuning.
 * Writes PNGs under tools/lookbook/captures/ (gitignored).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "captures");
const LOOKBOOK = join(HERE, "lookbook.html");

const FOCUS_IDS = [
  "cmaj7--lilyjazz",
  "cmaj7--lilypond-classical",
  "pm-csym-maj7-triangle",
  "g7b9--lilyjazz",
  "g7sharp9--lilyjazz",
  "c7sharp11--lilyjazz",
  "g7b13--lilyjazz",
  "g7b5--lilyjazz",
  "bm7b5--lilyjazz",
  "pm-csym-halfdim",
  "cdim--lilyjazz",
  "pm-csym-dim",
  "eb-triad--lilyjazz",
  "fsharp-triad--lilyjazz",
  "ps-bb-root",
  "ps-fs-root",
  "dm7-slash-g--lilyjazz",
  "c69--lilyjazz",
  "cm7--lilyjazz",
  "pm-csym-minor",
  "ob-g7b9",
  "ob-am7b5",
  "ob-bbmaj7",
  "f13--lilyjazz",
  "a13b9--lilyjazz",
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  await page.goto(`file://${LOOKBOOK}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  // Wait for cards to render
  await page.waitForSelector(".card");

  // Full overview strip of first screen
  await page.screenshot({
    path: join(OUT, "overview.png"),
    fullPage: false,
  });

  const notes: string[] = [];
  for (const id of FOCUS_IDS) {
    const card = page.locator(".card").filter({ hasText: id }).first();
    if ((await card.count()) === 0) {
      notes.push(`MISSING card: ${id}`);
      continue;
    }
    await card.scrollIntoViewIfNeeded();
    const path = join(OUT, `${id}.png`);
    await card.screenshot({ path });
    notes.push(`captured ${id}`);
  }

  // Family-filtered montages for alterations / halfdim / roots
  for (const fam of ["alterations", "halfdim", "roots", "sevenths", "dim"]) {
    await page.evaluate((f) => {
      const buttons = [...document.querySelectorAll("nav button")];
      const match = buttons.find((b) => (b as HTMLElement).dataset.v === f);
      (match as HTMLButtonElement | undefined)?.click();
    }, fam);
    await page.waitForTimeout(150);
    await page.screenshot({
      path: join(OUT, `family-${fam}.png`),
      fullPage: true,
    });
  }

  await writeFile(join(OUT, "notes.txt"), notes.join("\n") + "\n");
  await browser.close();
  console.log(`Wrote captures to ${OUT}`);
  console.log(notes.join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
