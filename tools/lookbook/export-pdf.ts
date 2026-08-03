#!/usr/bin/env node
/**
 * Export lookbook.html → lookbook.pdf via Playwright.
 *
 * Critical: cards render after document.fonts.ready, images are lazy, and
 * ChordFont is a data: TTF. A bare goto()+pdf() captures empty/half-loaded
 * pages. This script waits for fonts, cards, .sym shaping, and every img.
 *
 *   make lookbook          # refresh HTML first
 *   make lookbook-pdf      # or:
 *   node --experimental-strip-types tools/lookbook/export-pdf.ts
 */
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HERE = dirname(fileURLToPath(import.meta.url));
const LOOKBOOK = join(HERE, "lookbook.html");
const OUT = join(HERE, "lookbook.pdf");

async function main() {
  try {
    await access(LOOKBOOK, constants.R_OK);
  } catch {
    console.error(`Missing ${LOOKBOOK}\nRun: make lookbook`);
    process.exit(1);
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1600, height: 2200 },
      deviceScaleFactor: 1,
    });

    await page.goto(`file://${LOOKBOOK}`, { waitUntil: "load", timeout: 60_000 });

    // Cards are created in document.fonts.ready.then(render) — wait for them.
    await page.waitForSelector(".card", { timeout: 30_000 });

    // ChordFont must be loaded and applied before PDF (data: TTF + liga/calt).
    await page.waitForFunction(
      async () => {
        await document.fonts.ready;
        const faces = [...document.fonts].filter((f) => f.family === "ChordFont");
        if (faces.length === 0) return false;
        if (faces.some((f) => f.status === "error")) {
          throw new Error("ChordFont failed to load");
        }
        const ok = document.fonts.check('2rem "ChordFont"');
        const syms = document.querySelectorAll(".ours .sym");
        if (syms.length === 0) return false;
        const sample = /** @type {HTMLElement} */ (syms[0]);
        return ok && sample.getBoundingClientRect().width > 2;
      },
      { timeout: 30_000 },
    );

    // Force every lazy image; wait for load or error (missing refs still PDF).
    const imageStats = await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll("img"));
      for (const img of imgs) {
        img.loading = "eager";
        // Re-assign src to kick browsers that ignored loading=eager mid-flight.
        if (img.src) img.src = img.src;
      }
      const results = await Promise.all(
        imgs.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete && img.naturalWidth > 0) {
                resolve({ src: img.currentSrc || img.src, ok: true });
                return;
              }
              if (img.complete && img.naturalWidth === 0) {
                resolve({ src: img.currentSrc || img.src, ok: false });
                return;
              }
              img.addEventListener(
                "load",
                () => resolve({ src: img.currentSrc || img.src, ok: true }),
                { once: true },
              );
              img.addEventListener(
                "error",
                () => resolve({ src: img.currentSrc || img.src, ok: false }),
                { once: true },
              );
            }),
        ),
      );
      return {
        total: results.length,
        ok: results.filter((r) => r.ok).length,
        missing: results.filter((r) => !r.ok).length,
      };
    });

    // Scroll through the page so any remaining layout/paint settles.
    await page.evaluate(async () => {
      const step = window.innerHeight;
      const max = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      for (let y = 0; y < max; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });

    // Final settle: fonts + two animation frames.
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
    });

    const cardCount = await page.locator(".card").count();
    const symCount = await page.locator(".ours .sym").count();

    await page.pdf({
      path: OUT,
      width: "1600px",
      height: "2200px",
      printBackground: true,
    });

    console.log(`Wrote ${OUT}`);
    console.log(
      `cards=${cardCount} shaped=${symCount} images=${imageStats.ok}/${imageStats.total} (missing=${imageStats.missing})`,
    );
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
