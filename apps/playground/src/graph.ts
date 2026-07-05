import { loadGraphviz, renderDot } from "@chordlang/graph";
import {
  CHART_BY_SLUG,
  DEFAULT_CHART_SLUG,
  DEFAULT_GRAPH_SLUG,
  GRAPH_BY_SLUG,
  GRAPH_MANIFEST,
} from "./examples";
import { parseRoute, resolveSlug, examplePath } from "./routes";
import { onRouteChange, wireExampleNav } from "./playground";

document.querySelector<HTMLAnchorElement>("#chart-home")!.href =
  examplePath("chart", DEFAULT_CHART_SLUG);

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
const source = $<HTMLTextAreaElement>("#source");
const canvas = $("#graph");
const status = $("#status");
const nav = $("#examples");

let graphviz: Awaited<ReturnType<typeof loadGraphviz>> | null = null;
let activeSlug = resolveSlug(parseRoute(location.pathname).slug, GRAPH_BY_SLUG, DEFAULT_GRAPH_SLUG);

function syncUrl(slug: string) {
  const parsed = parseRoute(location.pathname);
  if (parsed.slug !== slug) {
    history.replaceState(null, "", examplePath("graph", slug));
  }
}

async function render() {
  if (!graphviz) return;
  const dot = source.value;
  try {
    const svg = renderDot(graphviz, dot);
    canvas.innerHTML = svg;
    status.textContent = "✓ rendered";
    status.className = "status ok";
  } catch (e) {
    canvas.innerHTML = "";
    status.textContent = `render error — ${(e as Error).message}`;
    status.className = "status err";
  }
}

function loadSlug(slug: string) {
  activeSlug = slug;
  source.value = GRAPH_BY_SLUG[slug]!.source;
  document.title = `${GRAPH_BY_SLUG[slug]!.label} — chordlang graph`;
  void render();
}

wireExampleNav({
  kind: "graph",
  nav,
  order: GRAPH_MANIFEST,
  bySlug: GRAPH_BY_SLUG,
  activeSlug,
  onSelect: loadSlug,
  peerKind: "chart",
  peerBySlug: CHART_BY_SLUG,
});

source.addEventListener("input", () => { void render(); });

onRouteChange(() => {
  const slug = resolveSlug(parseRoute(location.pathname).slug, GRAPH_BY_SLUG, DEFAULT_GRAPH_SLUG);
  if (slug === activeSlug) return;
  loadSlug(slug);
  wireExampleNav({
    kind: "graph",
    nav,
    order: GRAPH_MANIFEST,
    bySlug: GRAPH_BY_SLUG,
    activeSlug: slug,
    onSelect: loadSlug,
    peerKind: "chart",
    peerBySlug: CHART_BY_SLUG,
  });
});

async function init() {
  status.textContent = "loading graphviz…";
  status.className = "status";
  graphviz = await loadGraphviz();
  loadSlug(activeSlug);
  syncUrl(activeSlug);
}

void init();
