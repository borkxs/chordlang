#!/usr/bin/env node
/**
 * ChordFont look book — reference crops/engravings next to live ChordFont.
 *
 * Inlines ChordProof.ttf (base64) so file:// works. Images stay as relative
 * refs/*.png paths — open lookbook.html from this directory.
 *
 *   make lookbook
 *   node --experimental-strip-types tools/lookbook/render-lookbook.ts
 */
import { access, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../..");
const DEFAULT_FONT = join(ROOT, "packages/font/dist/ChordProof.ttf");
const ENTRIES = join(HERE, "entries.json");
const OUT = join(HERE, "lookbook.html");

const FAM_ORDER = [
  "overview",
  "roots",
  "triads",
  "minor",
  "sixths",
  "sevenths",
  "extensions",
  "alterations",
  "halfdim",
  "dim",
  "sus",
  "slash",
  "accidental-binding",
  "in-context",
  "survey",
] as const;

const FAM_LABEL: Record<string, string> = {
  overview: "Overview",
  roots: "Roots & accidentals",
  triads: "Triads",
  minor: "Minor",
  sixths: "6 / 6–9",
  sevenths: "Sevenths / maj7",
  extensions: "9 / 11 / 13",
  alterations: "Alterations",
  halfdim: "Half-diminished",
  dim: "Diminished",
  sus: "Sus",
  slash: "Slash bass",
  "accidental-binding": "Accidental binding",
  "in-context": "In context",
  survey: "Survey",
};

const METHOD_LABEL: Record<string, string> = {
  crop: "Printed crop",
  "tool-engraving": "Tool engraving",
  "glyph-specimen": "Glyph specimen",
  external: "External",
};

interface LookEntry {
  id: string;
  method: string;
  family: string;
  canonical_ascii: string;
  shape_ascii: string | null;
  as_printed: string;
  display_note: string;
  label_status: string;
  house_style: string;
  observe: string[];
  priority: string;
  reference: {
    file?: string;
    remote_url?: string;
    source_title: string;
    license_or_use_basis: string;
    captured_at: string;
  };
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv: string[]) {
  let fontPath = DEFAULT_FONT;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--font" && argv[i + 1]) fontPath = resolve(argv[++i]);
    else if (argv[i] === "--help" || argv[i] === "-h") {
      console.log("Usage: render-lookbook.ts [--font TTF]");
      process.exit(0);
    }
  }
  return { fontPath };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHtml(entries: LookEntry[], fontBase64: string, fontLabel: string): string {
  const dataJson = JSON.stringify(entries);
  const famOrderJson = JSON.stringify(FAM_ORDER);
  const famLabelJson = JSON.stringify(FAM_LABEL);
  const methodLabelJson = JSON.stringify(METHOD_LABEL);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ChordFont Look Book</title>
<style>
@font-face {
  font-family: "ChordFont";
  src: url("data:font/ttf;base64,${fontBase64}") format("truetype");
}
:root { --paper:#faf7ef; --ink:#191713; --rule:#c9c2b2; --accent:#8a1f11; --dim:#6f6a5e; }
* { box-sizing: border-box }
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font: 15px/1.5 Georgia, "Times New Roman", serif;
}
header { padding: 28px 32px 18px; border-bottom: 3px double var(--ink); }
h1 { margin: 0; font-size: 26px; letter-spacing: .5px }
h1 .fancy { font-style: italic; color: var(--accent) }
.purpose { max-width: 72ch; color: var(--dim); margin-top: 8px }
.purpose code {
  font: 13px ui-monospace, Menlo, monospace;
  background: #efe9da;
  padding: 1px 5px;
  border-radius: 3px;
}
.meta { font-size: 12px; color: var(--dim); margin-top: 6px }
nav {
  position: sticky; top: 0; z-index: 2;
  background: var(--paper);
  border-bottom: 1px solid var(--rule);
  padding: 10px 32px;
  display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
}
nav .group-label {
  font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
  color: var(--dim); margin-right: 2px;
}
nav button {
  font: inherit; font-size: 13px;
  background: none; border: 1px solid var(--rule);
  border-radius: 14px; padding: 3px 12px; cursor: pointer; color: var(--ink);
}
nav button.on { background: var(--ink); color: var(--paper); border-color: var(--ink) }
nav .spacer { flex: 1 }
main {
  padding: 22px 32px 60px;
  display: grid; gap: 18px;
  grid-template-columns: repeat(auto-fill, minmax(430px, 1fr));
}
.card {
  border: 1px solid var(--rule);
  background: #fffdf7;
  padding: 14px 16px 12px;
  border-radius: 2px;
}
.card h3 {
  margin: 0 0 2px;
  font-size: 15px;
  display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;
}
.fam {
  font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: var(--dim);
}
.badge {
  font: 11px ui-monospace, monospace; color: #fff;
  background: var(--accent); border-radius: 3px; padding: 1px 6px;
}
.badge.method {
  background: #3d4a3a;
}
.cols {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px;
}
.cell {
  border: 1px solid var(--rule); background: #fff;
  min-height: 96px;
  display: flex; align-items: center; justify-content: center;
  padding: 18px 8px 8px; position: relative;
}
.cell .tag {
  position: absolute; top: 2px; left: 6px;
  font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--dim);
}
.cell img { max-width: 100%; max-height: 120px }
.cell.ours { background: #fff }
.ours .sym {
  font-family: "ChordFont", ui-sans-serif, serif;
  font-feature-settings: "liga" 1, "calt" 1;
  font-size: 2rem;
  line-height: 1.2;
  color: var(--ink);
}
.ours .na {
  font-size: 12px; color: var(--dim); text-align: center; padding: 0 8px;
}
.ascii { font: 16px ui-monospace, Menlo, monospace; margin: 8px 0 2px }
.printed { color: var(--dim); font-size: 13px }
.note { font-size: 12.5px; color: var(--dim); margin-top: 4px }
details { margin-top: 6px; font-size: 12.5px }
details summary { cursor: pointer; color: var(--accent) }
details li { margin: 2px 0 }
.prov {
  font-size: 11px; color: var(--dim);
  margin-top: 6px; border-top: 1px dotted var(--rule); padding-top: 5px;
}
footer {
  padding: 20px 32px;
  border-top: 3px double var(--ink);
  font-size: 13px; color: var(--dim);
}
</style>
</head>
<body>
<header>
  <h1>ChordFont Look Book <span class="fancy">— reference vs ours</span></h1>
  <p class="purpose">
    Real printed crops, tool engravings, and Petaluma glyph specimens next to
    <strong>live ChordFont</strong> shaping of the canonical ASCII.
    Feedback loop: tweak <code>packages/font/glyphs/source_map.json</code> or
    GSUB in <code>src/build_font.py</code> → <code>make lookbook</code> → compare.
    Exhaustive matrix remains <code>make font-atlas</code>.
  </p>
  <p class="meta">${escapeHtml(fontLabel)} · ${entries.length} entries · liga + calt on</p>
</header>
<nav id="nav"></nav>
<main id="grid"></main>
<footer>
  Provenance in <b>sources.json</b>. Regenerate HTML with
  <code>make lookbook</code>. Merge corpora with
  <code>python3 tools/lookbook/merge_corpora.py</code> when refreshing harvested/rendered.
  Gaps: <b>GAP_REPORT.md</b>.
</footer>
<script>
const FAMS = ${famOrderJson};
const LBL = ${famLabelJson};
const MLBL = ${methodLabelJson};
const DATA = ${dataJson};
let fam = "all", method = "all", hideConfirm = false;
const nav = document.getElementById("nav");
const grid = document.getElementById("grid");

function nb(label, key, val) {
  const b = document.createElement("button");
  b.textContent = label;
  b.dataset.key = key;
  b.dataset.v = val;
  b.onclick = () => {
    if (key === "fam") fam = val;
    else if (key === "method") method = val;
    render();
  };
  return b;
}

function buildNav() {
  nav.innerHTML = "";
  const famLab = document.createElement("span");
  famLab.className = "group-label";
  famLab.textContent = "Family";
  nav.appendChild(famLab);
  nav.appendChild(nb("All", "fam", "all"));
  FAMS.forEach((f) => {
    if (DATA.some((e) => e.family === f)) nav.appendChild(nb(LBL[f] || f, "fam", f));
  });

  const methLab = document.createElement("span");
  methLab.className = "group-label";
  methLab.style.marginLeft = "10px";
  methLab.textContent = "Method";
  nav.appendChild(methLab);
  nav.appendChild(nb("All", "method", "all"));
  ["crop", "tool-engraving", "glyph-specimen", "external"].forEach((m) => {
    if (DATA.some((e) => e.method === m)) nav.appendChild(nb(MLBL[m] || m, "method", m));
  });

  const spacer = document.createElement("span");
  spacer.className = "spacer";
  nav.appendChild(spacer);

  const ct = document.createElement("button");
  ct.id = "conf-toggle";
  ct.onclick = () => { hideConfirm = !hideConfirm; render(); };
  nav.appendChild(ct);
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function oursCell(e) {
  if (e.shape_ascii) {
    return \`<div class="cell ours"><span class="tag">ours</span>
      <span class="sym">\${esc(e.shape_ascii)}</span></div>\`;
  }
  return \`<div class="cell ours"><span class="tag">ours</span>
    <span class="na">not a ChordFont input<br>(glyph / chart specimen)</span></div>\`;
}

function render() {
  nav.querySelectorAll("button").forEach((b) => {
    const on =
      (b.dataset.key === "fam" && b.dataset.v === fam) ||
      (b.dataset.key === "method" && b.dataset.v === method) ||
      (b.id === "conf-toggle" && hideConfirm);
    b.classList.toggle("on", !!on);
  });
  const ct = document.getElementById("conf-toggle");
  if (ct) ct.textContent = hideConfirm ? "showing verified only" : "hide unconfirmed";

  grid.innerHTML = "";
  DATA.filter(
    (e) =>
      (fam === "all" || e.family === fam) &&
      (method === "all" || e.method === method) &&
      (!hideConfirm || e.label_status === "verified"),
  ).forEach((e) => {
    const r = e.reference;
    const remote = r.remote_url || "";
    const house = (e.house_style || "").split(" — ")[0];
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = \`
      <h3>\${esc(e.id)}
        \${e.label_status !== "verified" ? '<span class="badge">confirm label</span>' : ""}
        <span class="badge method">\${esc(MLBL[e.method] || e.method)}</span>
      </h3>
      <span class="fam">\${esc(LBL[e.family] || e.family)} · \${esc(e.priority)} · \${esc(house)}</span>
      <div class="cols">
        <div class="cell"><span class="tag">reference</span>
          <img src="\${esc(r.file || "")}" loading="lazy"
            onerror="if(this.dataset.f!=='1'&&'\${esc(remote)}'){this.dataset.f='1';this.src='\${esc(remote)}'}else{this.replaceWith(Object.assign(document.createElement('div'),{textContent:'image missing',style:'font-size:11px;color:#8a1f11'}))}">
        </div>
        \${oursCell(e)}
      </div>
      <div class="ascii">\${esc(e.canonical_ascii)}</div>
      <div class="printed">as printed: \${esc(e.as_printed || "—")}</div>
      <div class="note">\${esc(e.display_note || "")}</div>
      <details><summary>observe</summary><ul>\${(e.observe || []).map((o) => "<li>" + esc(o) + "</li>").join("")}</ul></details>
      <div class="prov">\${esc(r.source_title || "")} · \${esc((r.license_or_use_basis || "").split("—")[0].split(";")[0])} · \${esc(r.captured_at || "")}</div>\`;
    grid.appendChild(card);
  });
}

buildNav();
document.fonts.ready.then(render);
</script>
</body>
</html>
`;
}

async function main() {
  const { fontPath } = parseArgs(process.argv.slice(2));

  if (!(await exists(ENTRIES))) {
    console.error(`Missing ${ENTRIES}\nRun: python3 tools/lookbook/merge_corpora.py`);
    process.exit(1);
  }
  if (!(await exists(fontPath))) {
    console.error(`Missing font: ${fontPath}\nRun 'make font' first.`);
    process.exit(1);
  }

  const payload = JSON.parse(await readFile(ENTRIES, "utf8")) as {
    entries: LookEntry[];
  };
  const fontBase64 = (await readFile(fontPath)).toString("base64");
  const fontLabel = fontPath.replace(ROOT + "/", "");
  const html = renderHtml(payload.entries, fontBase64, fontLabel);
  await writeFile(OUT, html, "utf8");
  const shapeable = payload.entries.filter((e) => e.shape_ascii).length;
  console.log(`Wrote ${OUT}`);
  console.log(`${payload.entries.length} entries (${shapeable} with live ChordFont)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
