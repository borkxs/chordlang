/**
 * Chart renderer: same layout as @chordlang/render, plus a notation switch.
 * "chords" emits the canonical ASCII for ChordFont to shape; "roman" emits
 * numerals (ChordFont has no roman style yet, so they are set in the UI sans).
 */
import type { ChartAST, Cell } from "@chordlang/parser";
import { normalize } from "@chordlang/chord";
import { parseKey, toRoman, type Key } from "./roman";
import { intervalBetween, isUnison, keyAscii, resolveTarget, transposeSymbol, type Interval } from "./transpose";

export type Notation = "chords" | "roman";

export interface RenderOptions {
  /** Transpose the chart so its tonal centre matches this key (relative keys when modes differ). */
  transposeTo?: Key | null;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function cellHTML(cell: Cell, notation: Notation, key: Key | null, iv: Interval | null): string {
  if (cell.kind === "repeat") return `<span class="chordlang-repeat">%</span>`;
  if (cell.kind === "hold") return `<span class="chordlang-hold"></span>`;
  try {
    const c = iv ? normalize(transposeSymbol(normalize(cell.symbol), iv)) : normalize(cell.symbol);
    const harte = esc(c.render.harte);
    if (notation === "roman" && key) {
      const r = toRoman(c, key);
      const bass = r.bass
        ? `<span class="chordlang-slash">/</span><span class="chordlang-roman-b">${esc(r.bass)}</span>`
        : "";
      return `<span class="chordlang-symbol chordlang-roman" data-harte="${harte}" title="${esc(c.render.ascii)}">${esc(r.numeral)}<span class="chordlang-roman-q">${esc(r.suffix)}</span>${bass}</span>`;
    }
    const ascii = c.render.ascii;
    const slashIdx = c.bass ? ascii.lastIndexOf("/") : -1;
    if (slashIdx > 0) {
      const head = ascii.slice(0, slashIdx);
      const bassTxt = ascii.slice(slashIdx + 1);
      return `<span class="chordlang-symbol" data-harte="${harte}">${esc(head)}<span class="chordlang-slash">/</span>${esc(bassTxt)}</span>`;
    }
    return `<span class="chordlang-symbol" data-harte="${harte}">${esc(ascii)}</span>`;
  } catch {
    return `<span class="chordlang-symbol chordlang-error">${esc(cell.symbol)}</span>`;
  }
}

export function chartKey(ast: ChartAST): Key | null {
  return parseKey(ast.directives.find((d) => d.key === "key")?.value);
}

export function renderChart(ast: ChartAST, notation: Notation, opts: RenderOptions = {}): string {
  const title = ast.directives.find((d) => d.key === "title")?.value;
  const meta = ast.directives.filter((d) => d.key !== "title" && d.key !== "book");
  const sourceKey = chartKey(ast);
  let key = sourceKey;
  let iv: Interval | null = null;
  if (sourceKey && opts.transposeTo) {
    const target = resolveTarget(sourceKey, opts.transposeTo);
    const shift = intervalBetween(sourceKey.tonic, target.tonic);
    if (!isUnison(shift)) {
      iv = shift;
      key = target;
    }
  }
  const parts = [`<div class="chordlang-chart">`];
  if (title) parts.push(`<h2 class="chordlang-title">${esc(title)}</h2>`);
  if (meta.length) {
    const metaText = (d: { key: string; value: string }): string =>
      d.key === "key" && iv && key ? `key: ${esc(keyAscii(key))} (from ${esc(d.value)})` : `${esc(d.key)}: ${esc(d.value)}`;
    parts.push(`<div class="chordlang-meta">${meta.map((d) => `<span>${metaText(d)}</span>`).join(" · ")}</div>`);
  }
  if (notation === "roman" && !key) {
    parts.push(`<div class="chordlang-meta chordlang-warn">roman numerals need a {key: …} directive</div>`);
  }
  parts.push(`<div class="chordlang-grid">`);
  const { body } = ast;
  let pendingSection: string | null = null;
  for (let i = 0; i < body.length; i++) {
    const item = body[i];
    if (item.type === "section") {
      pendingSection = item.label;
    } else if (item.type === "bar") {
      if (pendingSection) {
        parts.push(
          `<div class="chordlang-section-row"><span class="chordlang-section">${esc(pendingSection)}</span></div>`,
        );
        pendingSection = null;
      }
      const next = body[i + 1];
      const isEnd = !next || next.type === "barline-end" || next.type === "section";
      const cls = isEnd ? "chordlang-bar chordlang-bar-end" : "chordlang-bar";
      parts.push(`<div class="${cls}">${item.cells.map((c) => cellHTML(c, notation, key, iv)).join("")}</div>`);
    }
  }
  parts.push(`</div></div>`);
  return parts.join("\n");
}
