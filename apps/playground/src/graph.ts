import { Graphviz } from "@hpcc-js/wasm";
import { GRAPH_EXAMPLES } from "./examples";

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
const source = $<HTMLTextAreaElement>("#source");
const canvas = $("#graph");
const status = $("#status");

let graphviz: Graphviz | null = null;

function styleSvg(svg: string): string {
  // Graphviz emits font-family on <text>; reinforce ChordFont + ligatures for engraving.
  return svg.replace(
    "<svg ",
    '<svg class="graph-svg" ',
  );
}

async function render() {
  if (!graphviz) return;
  const dot = source.value;
  try {
    const svg = styleSvg(graphviz.dot(dot, "svg"));
    canvas.innerHTML = svg;
    status.textContent = "✓ rendered";
    status.className = "status ok";
  } catch (e) {
    canvas.innerHTML = "";
    status.textContent = `render error — ${(e as Error).message}`;
    status.className = "status err";
  }
}

async function init() {
  status.textContent = "loading graphviz…";
  status.className = "status";
  graphviz = await Graphviz.load();
  status.textContent = "ready";
  status.className = "status ok";
  await render();
}

const nav = $("#examples");
for (const name of Object.keys(GRAPH_EXAMPLES)) {
  const b = document.createElement("button");
  b.textContent = name;
  b.className = "chip";
  b.onclick = () => { source.value = GRAPH_EXAMPLES[name]; void render(); };
  nav.appendChild(b);
}

source.addEventListener("input", () => { void render(); });
source.value = GRAPH_EXAMPLES["ii–V–I chain"];
void init();
