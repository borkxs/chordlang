import manifest from "../../../examples/manifest.json";

export type ExampleEntry = { file: string; label: string };

const chartFiles = import.meta.glob("../../../examples/charts/*.cfmd", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const graphFiles = import.meta.glob("../../../examples/graphs/*.cfgv", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export type LoadedExample = { label: string; source: string };

function loadCatalog(
  entries: ExampleEntry[],
  files: Record<string, string>,
  ext: "cfmd" | "cfgv",
): { bySlug: Record<string, LoadedExample>; order: ExampleEntry[] } {
  const bySlug: Record<string, LoadedExample> = {};
  for (const entry of entries) {
    const path = Object.keys(files).find((p) => p.endsWith(`/${entry.file}.${ext}`));
    if (!path) throw new Error(`missing example file: examples/*/${entry.file}.${ext}`);
    bySlug[entry.file] = { label: entry.label, source: files[path].trimEnd() };
  }
  return { bySlug, order: entries };
}

const charts = loadCatalog(manifest.charts, chartFiles, "cfmd");
const graphs = loadCatalog(manifest.graphs, graphFiles, "cfgv");

export const CHART_BY_SLUG = charts.bySlug;
export const GRAPH_BY_SLUG = graphs.bySlug;
export const CHART_MANIFEST = charts.order;
export const GRAPH_MANIFEST = graphs.order;

export const DEFAULT_CHART_SLUG = charts.order[0]!.file;
export const DEFAULT_GRAPH_SLUG = graphs.order[0]!.file;

/** @deprecated use CHART_BY_SLUG */
export const CHART_EXAMPLES = Object.fromEntries(
  Object.entries(CHART_BY_SLUG).map(([slug, ex]) => [ex.label, ex.source]),
);
/** @deprecated use GRAPH_BY_SLUG */
export const GRAPH_EXAMPLES = Object.fromEntries(
  Object.entries(GRAPH_BY_SLUG).map(([slug, ex]) => [ex.label, ex.source]),
);
