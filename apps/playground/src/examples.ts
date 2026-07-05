import manifest from "../../../examples/manifest.json";

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

function loadExamples(
  entries: { file: string; label: string }[],
  files: Record<string, string>,
  ext: "cfmd" | "cfgv",
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { file, label } of entries) {
    const path = Object.keys(files).find((p) => p.endsWith(`/${file}.${ext}`));
    if (!path) throw new Error(`missing example file: examples/*/${file}.${ext}`);
    out[label] = files[path].trimEnd();
  }
  return out;
}

export const CHART_EXAMPLES = loadExamples(manifest.charts, chartFiles, "cfmd");
export const GRAPH_EXAMPLES = loadExamples(manifest.graphs, graphFiles, "cfgv");

export type ExampleEntry = { file: string; label: string };

export const CHART_MANIFEST = manifest.charts as ExampleEntry[];
export const GRAPH_MANIFEST = manifest.graphs as ExampleEntry[];
