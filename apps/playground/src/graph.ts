import { Graphviz } from "@hpcc-js/wasm";

const EXAMPLES: Record<string, string> = {
  "ii–V–I chain": `digraph {
  rankdir=LR;
  graph [bgcolor="transparent" pad=0.4];
  node [shape=plaintext fontname="ChordFont" fontsize=36];
  edge [color="#6f6a5e" penwidth=1.4 arrowsize=0.7];

  Am7 -> D7 -> Gmaj7 -> Cmaj7 -> "F#m7b5" -> B7 -> Em7;
}`,
  "So What": `digraph {
  rankdir=LR;
  graph [bgcolor="transparent" pad=0.4];
  node [shape=plaintext fontname="ChordFont" fontsize=36];
  edge [color="#6f6a5e" penwidth=1.4 arrowsize=0.7];

  // Kind of Blue — two Dorian modes alternating (16-bar sections)
  Dm7 -> Ebm7 -> Dm7 -> Ebm7 -> Dm7;
  Dm7 -> Ebm7 [style=dashed color="#a8823c"];
  Ebm7 -> Dm7 [style=dashed color="#a8823c"];
}`,
  "Giant Steps": `digraph {
  rankdir=TB;
  graph [bgcolor="transparent" pad=0.4];
  node [shape=plaintext fontname="ChordFont" fontsize=32];
  edge [color="#6f6a5e" penwidth=1.4 arrowsize=0.7];

  // Coltrane cycle — major-third key centers
  Bmaj7 -> D7 -> Gmaj7;
  Gmaj7 -> Bb7 -> Ebmaj7;
  Ebmaj7 -> "F#7" -> Bmaj7;

  { rank=same; D7; Bb7; "F#7"; }
  { rank=same; Gmaj7; Ebmaj7; Bmaj7; }
}`,
  "Stella by Starlight": `digraph {
  rankdir=TB;
  graph [bgcolor="transparent" pad=0.4];
  node [shape=plaintext fontname="ChordFont" fontsize=28];
  edge [color="#6f6a5e" penwidth=1.4 arrowsize=0.7];

  // A section — chromatic ii–V chains through several key areas
  Em7b5 -> A7 -> Cm7 -> F7 -> Fm7 -> Bb7 -> Ebmaj7 -> Ab7;
  Ab7 -> Dbmaj7 -> C7alt -> Fm7 -> Bb7;
  Bb7 -> Em7b5 -> A7 -> Dm7 -> G7;
  G7 -> Cm7 -> F7 -> Bbmaj7;
}`,
  "Rhythm changes": `digraph {
  rankdir=TB;
  graph [bgcolor="transparent" pad=0.4];
  node [shape=plaintext fontname="ChordFont" fontsize=30];
  edge [color="#6f6a5e" penwidth=1.4 arrowsize=0.7];

  subgraph cluster_a {
    label="A (×2)";
    style=dashed; color="#a8823c"; fontname="Helvetica"; fontsize=11;
    Bbmaj7 -> G7 -> Cm7 -> F7 -> Bbmaj7;
  }

  F7 -> D7 [lhead=cluster_b];
  subgraph cluster_b {
    label="B — bridge";
    style=dashed; color="#a8823c"; fontname="Helvetica"; fontsize=11;
    D7 -> G7 -> C7 -> F7;
  }

  F7 -> Bbmaj7 [label="A'"; fontname="Helvetica"; fontsize=10; color="#a8823c"];
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
