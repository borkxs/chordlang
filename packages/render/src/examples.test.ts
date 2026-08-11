import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseChart } from "@chordlang/parser";
import { normalize } from "@chordlang/chord";
import { renderChartToHTML } from "./index";

const CHARTS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../examples/charts",
);

describe("examples/charts — every chord normalizes", () => {
  const files = readdirSync(CHARTS_DIR).filter((f) => f.endsWith(".cfmd"));
  expect(files.length).toBeGreaterThan(0);

  for (const file of files) {
    it(`${file} has no normalize failures`, () => {
      const src = readFileSync(join(CHARTS_DIR, file), "utf8");
      const ast = parseChart(src);
      const failures: string[] = [];
      for (const item of ast.body) {
        if (item.type !== "bar") continue;
        for (const cell of item.cells) {
          if (cell.kind !== "chord") continue;
          try {
            normalize(cell.symbol);
          } catch {
            failures.push(cell.symbol);
          }
        }
      }
      const html = renderChartToHTML(ast, { normalize, lenient: true });
      expect(html).not.toContain("chordlang-error");
      expect(failures).toEqual([]);
    });
  }
});
