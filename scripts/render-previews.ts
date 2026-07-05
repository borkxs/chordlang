/**
 * Render example previews for docs/assets/ (README embeds, publish-ready).
 *
 * Charts: .cfmd → HTML + ChordFont → PNG (Playwright)
 * Graphs: .cfgv → Graphviz SVG → PNG + SVG (Playwright applies ChordFont to labels)
 *
 * Usage: make previews   (requires Node 22+, ChordProof.ttf, Playwright chromium)
 */
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium, type Browser } from "playwright";
import { Graphviz } from "@hpcc-js/wasm";
import manifest from "../examples/manifest.json" with { type: "json" };
import { parseChart } from "../packages/parse/src/index.ts";
import { normalize } from "../packages/chord/src/index.ts";
import { renderChartToHTML } from "../packages/render/src/index.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FONT = join(ROOT, "apps/playground/public/fonts/ChordProof.ttf");
const CHART_CSS = join(ROOT, "packages/render/chart.css");
const CHARTS_SRC = join(ROOT, "examples/charts");
const GRAPHS_SRC = join(ROOT, "examples/graphs");
const OUT_CHARTS = join(ROOT, "docs/assets/charts");
const OUT_GRAPHS = join(ROOT, "docs/assets/graphs");

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function fontFace(): string {
  return `@font-face{font-family:"ChordFont";src:url("${pathToFileURL(FONT).href}") format("truetype");}`;
}

async function screenshot(browser: Browser, html: string, selector: string, outPath: string) {
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.locator(selector).screenshot({ path: outPath, type: "png" });
  await page.close();
}

async function renderCharts(browser: Browser, chartCss: string) {
  for (const { file } of manifest.charts) {
    const src = await readFile(join(CHARTS_SRC, `${file}.cfmd`), "utf8");
    const html = renderChartToHTML(parseChart(src), { normalize, lenient: true });
    const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${fontFace()}
body{margin:0;background:#888}
${chartCss}
.page{margin:0;box-shadow:none}
</style></head><body><div class="page">${html}</div></body></html>`;
    await screenshot(browser, doc, ".page", join(OUT_CHARTS, `${file}.png`));
    console.log(`  charts/${file}.png`);
  }
}

async function renderGraphs(browser: Browser, graphviz: Graphviz) {
  for (const { file } of manifest.graphs) {
    const dot = (await readFile(join(GRAPHS_SRC, `${file}.cfgv`), "utf8")).trimEnd();
    const svg = graphviz.dot(dot, "svg");
    await writeFile(join(OUT_GRAPHS, `${file}.svg`), svg, "utf8");

    const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${fontFace()}
body{margin:0;background:#888}
.wrap{background:#fbf8f1;padding:24px;display:inline-block}
.wrap text{font-family:"ChordFont",ui-sans-serif!important;font-feature-settings:"liga" 1,"calt" 1;fill:#1a1815}
</style></head><body><div class="wrap">${svg}</div></body></html>`;
    await screenshot(browser, doc, ".wrap", join(OUT_GRAPHS, `${file}.png`));
    console.log(`  graphs/${file}.svg`);
    console.log(`  graphs/${file}.png`);
  }
}

async function main() {
  if (!(await exists(FONT))) {
    console.error(`Missing ${FONT} — run 'make font' first.`);
    process.exit(1);
  }

  await mkdir(OUT_CHARTS, { recursive: true });
  await mkdir(OUT_GRAPHS, { recursive: true });

  const chartCss = await readFile(CHART_CSS, "utf8");
  const browser = await chromium.launch();
  const graphviz = await Graphviz.load();

  try {
    console.log("Rendering chart previews…");
    await renderCharts(browser, chartCss);
    console.log("Rendering graph previews…");
    await renderGraphs(browser, graphviz);
  } finally {
    await browser.close();
  }

  console.log("\nWrote previews to docs/assets/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
