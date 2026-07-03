/**
 * @chordlang/render — chart engraving layer.
 * Chart LAYOUT is ours (measure grid, sections, beat cells); chord SYMBOL
 * engraving is the font's (chordfont via GSUB: ascii in, engraved out).
 * We therefore emit the chord's *ascii* form and let the font shape it.
 * Consumer supplies @font-face for "ChordFont"; we don't bundle it.
 */
import type { ChartAST, Cell } from "@chordlang/parse";
import type { Canonical } from "@chordlang/chord";

export interface RenderOptions {
  normalize: (symbol: string) => Canonical;
  /** if true, render normalize() failures as raw text with an error class */
  lenient?: boolean;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function cellHTML(cell: Cell, opts: RenderOptions): string {
  if (cell.kind === "repeat") return `<span class="chordlang-repeat">%</span>`;
  if (cell.kind === "hold") return `<span class="chordlang-hold"></span>`;
  try {
    const c = opts.normalize(cell.symbol);
    return `<span class="chordlang-symbol" data-harte="${esc(c.render.harte)}">${esc(c.render.ascii)}</span>`;
  } catch (e) {
    if (opts.lenient) return `<span class="chordlang-symbol chordlang-error">${esc(cell.symbol)}</span>`;
    throw e;
  }
}

export function renderChartToHTML(ast: ChartAST, opts: RenderOptions): string {
  const title = ast.directives.find((d) => d.key === "title")?.value;
  const meta = ast.directives.filter((d) => d.key !== "title");
  const parts: string[] = [`<div class="chordlang-chart">`];
  if (title) parts.push(`<h2 class="chordlang-title">${esc(title)}</h2>`);
  if (meta.length)
    parts.push(
      `<div class="chordlang-meta">${meta.map((d) => `<span>${esc(d.key)}: ${esc(d.value)}</span>`).join(" · ")}</div>`
    );
  parts.push(`<div class="chordlang-grid">`);
  for (const item of ast.body) {
    if (item.type === "section")
      parts.push(`<div class="chordlang-section">${esc(item.label)}</div>`);
    else if (item.type === "bar")
      parts.push(
        `<div class="chordlang-bar">${item.cells.map((c) => cellHTML(c, opts)).join("")}</div>`
      );
  }
  parts.push(`</div></div>`);
  return parts.join("\n");
}
