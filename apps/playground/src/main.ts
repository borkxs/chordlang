import { parseChart } from "@chordlang/parse";
import { normalize } from "@chordlang/chord";
import { renderChartToHTML } from "@chordlang/render";
import {
  CHART_BY_SLUG,
  CHART_MANIFEST,
  DEFAULT_CHART_SLUG,
  GRAPH_BY_SLUG,
} from "./examples";
import { parseRoute, resolveSlug, examplePath } from "./routes";
import { onRouteChange, wireExampleNav } from "./playground";

document.querySelector<HTMLAnchorElement>("#graph-demo")!.href =
  examplePath("graph", DEFAULT_GRAPH_SLUG);

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
const source = $<HTMLTextAreaElement>("#source");
const page = $("#page");
const astView = $("#view-ast");
const canonView = $("#view-canonical");
const status = $("#status");
const nav = $("#examples");

let activeSlug = resolveSlug(parseRoute(location.pathname).slug, CHART_BY_SLUG, DEFAULT_CHART_SLUG);

function syncUrl(slug: string) {
  const parsed = parseRoute(location.pathname);
  if (parsed.slug !== slug) {
    history.replaceState(null, "", examplePath("chart", slug));
  }
}

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

function loadSlug(slug: string) {
  activeSlug = slug;
  source.value = CHART_BY_SLUG[slug]!.source;
  document.title = `${CHART_BY_SLUG[slug]!.label} — chordlang`;
  update();
}

wireExampleNav({
  kind: "chart",
  nav,
  order: CHART_MANIFEST,
  bySlug: CHART_BY_SLUG,
  activeSlug,
  onSelect: loadSlug,
  peerKind: "graph",
  peerBySlug: GRAPH_BY_SLUG,
});

document.querySelectorAll<HTMLButtonElement>(".tab").forEach((tab) => {
  tab.onclick = () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    tab.classList.add("active");
    $(`#view-${tab.dataset.view}`).classList.add("active");
  };
});

source.addEventListener("input", update);

onRouteChange(() => {
  const slug = resolveSlug(parseRoute(location.pathname).slug, CHART_BY_SLUG, DEFAULT_CHART_SLUG);
  if (slug === activeSlug) return;
  loadSlug(slug);
  wireExampleNav({
    kind: "chart",
    nav,
    order: CHART_MANIFEST,
    bySlug: CHART_BY_SLUG,
    activeSlug: slug,
    onSelect: loadSlug,
    peerKind: "graph",
    peerBySlug: GRAPH_BY_SLUG,
  });
});

loadSlug(activeSlug);
syncUrl(activeSlug);
