import { parseChart } from "@chordlang/parser";
import { normalize } from "@chordlang/chord";
import { renderChartToHTML } from "@chordlang/render";
import { loadGraphviz, renderDot } from "@chordlang/graph";
import {
  CHART_BY_SLUG,
  GRAPH_BY_SLUG,
  DEFAULT_CHART_SLUG,
  DEFAULT_GRAPH_SLUG,
  exampleIndex,
  findExample,
  type LoadedExample,
} from "./examples";
import { parseRoute, resolveSlug, examplePath } from "./routes";
import {
  onRouteChange,
  closeMenus,
  wireExamplePicker,
  wireBuildPicker,
  refreshExampleChrome,
  renderFlagStrip,
  applyBuild,
  navigateExample,
} from "./playground";
import {
  DEFAULT_BUILD_ID,
  buildById,
  defaultBuildForStyle,
  activeFeatureList,
  type FontBuild,
  type FontStyle,
} from "./builds";

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;

const source = $<HTMLTextAreaElement>("#source");
const page = $("#page");
const graphCanvas = $("#graph");
const astView = $("#view-ast");
const canonView = $("#view-canonical");
const dotView = $("#view-dot");
const srcFile = $("#src-file");
const exampleBtn = $("#example-btn");
const exampleMenu = $("#example-menu");
const exampleName = $("#example-name");
const exampleBadge = $("#example-badge");
const buildBtn = $("#build-btn");
const buildMenu = $("#build-menu");
const buildName = $("#build-name");
const flagStrip = $("#flag-strip");
const fontStyleSelect = $<HTMLSelectElement>("#font-style");
const outTabs = $("#out-tabs");
const statMsg = $("#stat-msg");
const statBuild = $("#stat-build");
const statFeat = $("#stat-feat");

const CHART_TABS = ["chart", "ast", "canonical"] as const;
const GRAPH_TABS = ["graph", "dot", "canonical"] as const;
type OutTab = (typeof CHART_TABS)[number] | (typeof GRAPH_TABS)[number];

let graphviz: Awaited<ReturnType<typeof loadGraphviz>> | null = null;
let graphvizLoading: Promise<void> | null = null;

function resolveInitialExample(): LoadedExample {
  const parsed = parseRoute(location.pathname);
  if (parsed.kind === "graph") {
    const slug = resolveSlug(parsed.slug, GRAPH_BY_SLUG, DEFAULT_GRAPH_SLUG);
    return GRAPH_BY_SLUG[slug]!;
  }
  const slug = resolveSlug(parsed.slug, CHART_BY_SLUG, DEFAULT_CHART_SLUG);
  return CHART_BY_SLUG[slug]!;
}

let active = resolveInitialExample();
let activeBuild: FontBuild = buildById(DEFAULT_BUILD_ID);
let outTab: OutTab = active.kind === "graph" ? "graph" : "chart";
let baselineSource = active.source;

function syncUrl(ex: LoadedExample): void {
  const parsed = parseRoute(location.pathname);
  if (parsed.kind !== ex.kind || parsed.slug !== ex.slug) {
    history.replaceState(null, "", examplePath(ex.kind, ex.slug));
  }
}

function setStatus(kind: "ok" | "warn" | "err" | "", message: string): void {
  statMsg.textContent = message;
  statMsg.className = `msg${kind ? ` ${kind}` : ""}`;
}

function updateBuildChrome(): void {
  buildName.textContent = activeBuild.name;
  renderFlagStrip(flagStrip, activeBuild);
  applyBuild(document.documentElement, activeBuild);
  fontStyleSelect.value = activeBuild.style;
  statBuild.textContent = activeBuild.file;
  statFeat.textContent = activeFeatureList(activeBuild.flags) || "—";
}

function setOutTab(tab: OutTab): void {
  outTab = tab;
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  const viewId =
    tab === "chart" ? "view-chart"
    : tab === "graph" ? "view-graph"
    : tab === "ast" ? "view-ast"
    : tab === "dot" ? "view-dot"
    : "view-canonical";
  $(`#${viewId}`).classList.add("active");
  outTabs.querySelectorAll(".tab").forEach((el) => {
    el.classList.toggle("on", (el as HTMLElement).dataset.t === tab);
  });
}

function renderOutTabs(): void {
  const tabs = active.kind === "graph" ? GRAPH_TABS : CHART_TABS;
  if (!(tabs as readonly string[]).includes(outTab)) {
    outTab = tabs[0];
  }
  const labels: Record<string, string> = {
    chart: "Chart",
    graph: "Graph",
    ast: "AST",
    dot: "DOT",
    canonical: "Canonical",
  };
  outTabs.innerHTML = tabs
    .map(
      (t) =>
        `<button type="button" class="tab ${t === outTab ? "on" : ""}" data-t="${t}" role="tab">${labels[t]}</button>`,
    )
    .join("");
  outTabs.querySelectorAll<HTMLButtonElement>(".tab").forEach((el) => {
    el.onclick = () => setOutTab(el.dataset.t as OutTab);
  });
  setOutTab(outTab);
}

function updateChart(): void {
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
            try {
              canon.push(normalize(cell.symbol));
            } catch {
              errors.push(cell.symbol);
            }
          }
    canonView.textContent = JSON.stringify(canon, null, 2);
    setStatus(
      errors.length ? "warn" : "ok",
      errors.length
        ? `⚠ ${errors.length} symbol(s) failed to normalize: ${[...new Set(errors)].join(", ")}`
        : `✓ ${canon.length} chords normalized`,
    );
  } catch (e) {
    setStatus("err", `parse error — ${(e as Error).message}`);
  }
}

async function ensureGraphviz(): Promise<boolean> {
  if (graphviz) return true;
  if (!graphvizLoading) {
    setStatus("", "loading graphviz…");
    graphvizLoading = loadGraphviz()
      .then((gv) => {
        graphviz = gv;
      })
      .catch((e) => {
        graphvizLoading = null;
        setStatus("err", `graphviz load failed — ${(e as Error).message}`);
        throw e;
      });
  }
  try {
    await graphvizLoading;
    return !!graphviz;
  } catch {
    return false;
  }
}

async function updateGraph(): Promise<void> {
  const ok = await ensureGraphviz();
  if (!ok || !graphviz) return;
  const dot = source.value;
  dotView.textContent = dot;
  try {
    graphCanvas.innerHTML = renderDot(graphviz, dot);
    const labels = [...dot.matchAll(/\blabel\s*=\s*"([^"]*)"/gi)].map((m) => m[1]);
    canonView.textContent = labels.length
      ? JSON.stringify(labels, null, 2)
      : "// no label= attributes found";
    setStatus("ok", "✓ rendered");
  } catch (e) {
    graphCanvas.innerHTML = "";
    setStatus("err", `render error — ${(e as Error).message}`);
  }
}

function update(): void {
  if (active.kind === "graph") void updateGraph();
  else updateChart();
}

function loadExample(ex: LoadedExample, opts: { push?: boolean; resetSource?: boolean } = {}): void {
  active = ex;
  if (opts.push) navigateExample(ex);
  else syncUrl(ex);

  srcFile.textContent = ex.filename;
  refreshExampleChrome(exampleName, exampleBadge, ex);
  document.title = `${ex.label} — chordlang`;

  if (opts.resetSource !== false) {
    baselineSource = ex.source;
    source.value = ex.source;
  }

  renderOutTabs();
  update();
}

function setBuild(build: FontBuild): void {
  activeBuild = build;
  updateBuildChrome();
}

wireExamplePicker({
  button: exampleBtn,
  menu: exampleMenu,
  prevBtn: $("#prev-ex"),
  nextBtn: $("#next-ex"),
  getIndex: () => {
    const i = exampleIndex(active.kind, active.slug);
    return i < 0 ? 0 : i;
  },
  onSelect: (ex, push) => loadExample(ex, { push }),
});

wireBuildPicker({
  button: buildBtn,
  menu: buildMenu,
  getId: () => activeBuild.id,
  onSelect: setBuild,
});

fontStyleSelect.addEventListener("change", () => {
  setBuild(defaultBuildForStyle(fontStyleSelect.value as FontStyle));
});

document.addEventListener("click", (ev) => {
  if (!(ev.target as HTMLElement).closest(".ctl")) closeMenus();
});

source.addEventListener("input", update);

$("#copy-source").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(source.value);
    const btn = $("#copy-source");
    const prev = btn.textContent;
    btn.textContent = "copied";
    setTimeout(() => {
      btn.textContent = prev;
    }, 1200);
  } catch {
    /* ignore */
  }
});

$("#reset-source").addEventListener("click", () => {
  source.value = baselineSource;
  update();
});

$("#copy-link").addEventListener("click", async () => {
  const btn = $("#copy-link");
  try {
    await navigator.clipboard.writeText(location.href);
    btn.textContent = "Copied!";
  } catch {
    btn.textContent = "Copy failed";
  }
  setTimeout(() => {
    btn.textContent = "Copy link";
  }, 1400);
});

onRouteChange(() => {
  const parsed = parseRoute(location.pathname);
  const slug =
    parsed.kind === "graph"
      ? resolveSlug(parsed.slug, GRAPH_BY_SLUG, DEFAULT_GRAPH_SLUG)
      : resolveSlug(parsed.slug, CHART_BY_SLUG, DEFAULT_CHART_SLUG);
  const ex = findExample(parsed.kind, slug);
  if (!ex) return;
  if (ex.kind === active.kind && ex.slug === active.slug) return;
  loadExample(ex, { push: false });
});

updateBuildChrome();
loadExample(active, { push: false });
