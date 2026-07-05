/**
 * @chordlang/graph — render `.cfgv` Graphviz DOT to styled SVG.
 * Node labels are expected to use fontname="ChordFont"; consumer supplies the font.
 */
import { Graphviz } from "@hpcc-js/wasm";

type GraphvizWasm = Awaited<ReturnType<typeof Graphviz.load>>;

export function styleSvg(svg: string): string {
  return svg.replace("<svg ", '<svg class="graph-svg" ');
}

export async function loadGraphviz(): Promise<GraphvizWasm> {
  return Graphviz.load();
}

export function renderDot(graphviz: GraphvizWasm, dot: string): string {
  return styleSvg(graphviz.dot(dot, "svg"));
}

export async function renderDotToSvg(dot: string): Promise<string> {
  const graphviz = await loadGraphviz();
  return renderDot(graphviz, dot);
}
