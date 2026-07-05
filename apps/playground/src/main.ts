import { parseChart } from "@chordlang/parse";
import { normalize } from "@chordlang/chord";
import { renderChartToHTML } from "@chordlang/render";
import { CHART_EXAMPLES } from "./examples";

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
const source = $<HTMLTextAreaElement>("#source");
const page = $("#page");
const astView = $("#view-ast");
const canonView = $("#view-canonical");
const status = $("#status");

function update() {
  const src = source.value;
  try {
    const ast = parseChart(src);
    page.innerHTML = renderChartToHTML(ast, { normalize, lenient: true });
    astView.textContent = JSON.stringify(ast, null, 2);

    const canon: unknown[] = [];
    const errors: string[] = [];
    for (const item of ast.body)
      if (item.type === "bar")
        for (const cell of item.cells)
          if (cell.kind === "chord") {
            try { canon.push(normalize(cell.symbol)); }
            catch { errors.push(cell.symbol); }
          }
    canonView.textContent = JSON.stringify(canon, null, 2);
    status.textContent = errors.length
      ? `⚠ ${errors.length} symbol(s) failed to normalize: ${[...new Set(errors)].join(", ")}`
      : `✓ ${canon.length} chords normalized`;
    status.className = errors.length ? "status warn" : "status ok";
  } catch (e) {
    status.textContent = `parse error — ${(e as Error).message}`;
    status.className = "status err";
  }
}

// example chips
const nav = $("#examples");
for (const name of Object.keys(CHART_EXAMPLES)) {
  const b = document.createElement("button");
  b.textContent = name;
  b.className = "chip";
  b.onclick = () => { source.value = CHART_EXAMPLES[name]; update(); };
  nav.appendChild(b);
}

// tabs
document.querySelectorAll<HTMLButtonElement>(".tab").forEach((tab) => {
  tab.onclick = () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    tab.classList.add("active");
    $(`#view-${tab.dataset.view}`).classList.add("active");
  };
});

source.addEventListener("input", update);
source.value = CHART_EXAMPLES["Walkin Thing"];
update();
