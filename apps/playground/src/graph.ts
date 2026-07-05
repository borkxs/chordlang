import { Graphviz } from "@hpcc-js/wasm";

const EXAMPLES: Record<string, string> = {
  "ii–V–I chain": `digraph {
  rankdir=LR;
  graph [bgcolor="transparent" pad=0.4];
  node [shape=plaintext fontname="ChordFont" fontsize=36];
  edge [color="#6f6a5e" penwidth=1.4 arrowsize=0.7];

  Am7 -> D7 -> Gmaj7 -> Cmaj7 -> F#m7b5 -> B7 -> Em7;
}`,
  "Blues turnaround": `digraph {
  rankdir=TB;
  graph [bgcolor="transparent" pad=0.4];
  node [shape=plaintext fontname="ChordFont" fontsize=34];
  edge [color="#6f6a5e" penwidth=1.4 arrowsize=0.7];

  F7 -> Bb7 -> F7;
  F7 -> Cm7;
  Cm7 -> F7;
  F7 -> Am7b5;
  Am7b5 -> D7;
  D7 -> Gm7;
  Gm7 -> C7;
  C7 -> F7;
}`,
  "Autumn Leaves (A)": `digraph {
  rankdir=TB;
  graph [bgcolor="transparent" pad=0.4];
  node [shape=plaintext fontname="ChordFont" fontsize=32];
  edge [color="#6f6a5e" penwidth=1.4 arrowsize=0.7];

  Cm7 -> F7 -> Bbmaj7 -> Ebmaj7;
  Am7b5 -> D7 -> Gm7;
  Gm7 -> C7 -> Fm7 -> Bb7 -> Ebmaj7;
}`,
};

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
for (const name of Object.keys(EXAMPLES)) {
  const b = document.createElement("button");
  b.textContent = name;
  b.className = "chip";
  b.onclick = () => { source.value = EXAMPLES[name]; void render(); };
  nav.appendChild(b);
}

source.addEventListener("input", () => { void render(); });
source.value = EXAMPLES["ii–V–I chain"];
void init();
