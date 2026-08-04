import manifest from "../../../examples/manifest.json";
import type { PlaygroundKind } from "./routes";

export type ExampleEntry = { file: string; label: string; group?: string };

export type LoadedExample = {
  kind: PlaygroundKind;
  slug: string;
  label: string;
  group: string;
  /** Short type badge: md (chart) / gv (graph). */
  badge: "md" | "gv";
  /** Filename shown on the source pane tab. */
  filename: string;
  source: string;
};

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

function loadCatalog(
  kind: PlaygroundKind,
  entries: ExampleEntry[],
  files: Record<string, string>,
  ext: "cfmd" | "cfgv",
  defaultGroup: string,
): LoadedExample[] {
  return entries.map((entry) => {
    const path = Object.keys(files).find((p) => p.endsWith(`/${entry.file}.${ext}`));
    if (!path) throw new Error(`missing example file: examples/*/${entry.file}.${ext}`);
    return {
      kind,
      slug: entry.file,
      label: entry.label,
      group: entry.group ?? defaultGroup,
      badge: kind === "chart" ? "md" : "gv",
      filename: `${entry.file}.${ext}`,
      source: files[path].trimEnd(),
    };
  });
}

const charts = loadCatalog("chart", manifest.charts, chartFiles, "cfmd", "Jazz");
const graphs = loadCatalog("graph", manifest.graphs, graphFiles, "cfgv", "Graphs");

/** Flat ordered catalog: charts then graphs (picker groups by `group`). */
export const EXAMPLES: LoadedExample[] = [...charts, ...graphs];

export const EXAMPLE_BY_KEY = Object.fromEntries(
  EXAMPLES.map((ex) => [`${ex.kind}/${ex.slug}`, ex]),
) as Record<string, LoadedExample>;

export const CHART_BY_SLUG = Object.fromEntries(
  charts.map((ex) => [ex.slug, ex]),
) as Record<string, LoadedExample>;

export const GRAPH_BY_SLUG = Object.fromEntries(
  graphs.map((ex) => [ex.slug, ex]),
) as Record<string, LoadedExample>;

export const CHART_MANIFEST: ExampleEntry[] = manifest.charts;
export const GRAPH_MANIFEST: ExampleEntry[] = manifest.graphs;

export const DEFAULT_CHART_SLUG = charts[0]!.slug;
export const DEFAULT_GRAPH_SLUG = graphs[0]!.slug;

export function exampleKey(kind: PlaygroundKind, slug: string): string {
  return `${kind}/${slug}`;
}

export function findExample(kind: PlaygroundKind, slug: string): LoadedExample | undefined {
  return EXAMPLE_BY_KEY[exampleKey(kind, slug)];
}

export function exampleIndex(kind: PlaygroundKind, slug: string): number {
  return EXAMPLES.findIndex((ex) => ex.kind === kind && ex.slug === slug);
}

/** Ordered group names as they first appear in EXAMPLES. */
export function exampleGroups(): string[] {
  const seen = new Set<string>();
  const groups: string[] = [];
  for (const ex of EXAMPLES) {
    if (seen.has(ex.group)) continue;
    seen.add(ex.group);
    groups.push(ex.group);
  }
  return groups;
}
