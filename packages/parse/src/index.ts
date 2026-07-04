/**
 * @chordlang/parse — chart-structure parser.
 * The grammar (src/chart.peggy) is the format spec. Generated parser lands in
 * src/generated/ via `make grammar`. Chord tokens are opaque; see @chordlang/chord.
 */
// @ts-ignore -- generated at build time by peggy (make grammar)
import * as parser from "./generated/chart.mjs";

export interface Directive { key: string; value: string }
export type Cell =
  | { kind: "chord"; symbol: string }
  | { kind: "repeat" }
  | { kind: "hold" };
export interface Bar { type: "bar"; cells: Cell[] }
export interface Section { type: "section"; label: string }
export type BodyItem = Bar | Section | { type: "barline-end" };
export interface ChartAST {
  type: "chart";
  directives: Directive[];
  body: BodyItem[];
}

export function parseChart(src: string): ChartAST {
  return parser.parse(src) as ChartAST;
}
