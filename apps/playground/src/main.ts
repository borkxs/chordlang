import { parseChart } from "@chordlang/parse";
import { normalize } from "@chordlang/chord";
import { renderChartToHTML } from "@chordlang/render";

const EXAMPLES: Record<string, string> = {
  "Walkin Thing": `{title: A Walkin Thing}
{composer: Benny Carter}
{key: Dm}
{time: 4/4}
[A]
| Dm7 | Bm7b5,Bb7 | Dm7/A | Em7b5,A7 |
| Dm7 | Bm7b5,Bb7 | Dm7/A | % |
[B]
| Gm7 | C7 | Fmaj7 | Bm7b5,E7 |`,
  "Stress test": `{title: Normalizer stress test}
| Cmaj7 | F#m7b5 | C7alt | C/E |
| C6/9 | C-7 | C^7 | F#o7 |`,
  "Blues in F": `{title: F Blues}
{key: F}
| F7 | Bb7 | F7 | Cm7,F7 |
| Bb7 | % | F7 | Am7b5,D7 |
| Gm7 | C7 | F7,D7 | Gm7,C7 |`,
};

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
for (const name of Object.keys(EXAMPLES)) {
  const b = document.createElement("button");
  b.textContent = name;
  b.className = "chip";
  b.onclick = () => { source.value = EXAMPLES[name]; update(); };
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
source.value = EXAMPLES["Walkin Thing"];
update();
