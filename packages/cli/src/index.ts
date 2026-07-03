#!/usr/bin/env node
/** @chordlang/cli — parse / normalize / render a chart file. */
import { readFileSync } from "node:fs";
import { parseChart } from "@chordlang/parse";
import { normalize } from "@chordlang/chord";
import { renderChartToHTML } from "@chordlang/render";

const [, , cmd, file] = process.argv;
if (!cmd || !file) {
  console.error("usage: chordlang <ast|canonical|html> <file.chart>");
  process.exit(1);
}
const src = readFileSync(file, "utf8");
const ast = parseChart(src);
if (cmd === "ast") console.log(JSON.stringify(ast, null, 2));
else if (cmd === "canonical") {
  for (const item of ast.body)
    if (item.type === "bar")
      for (const cell of item.cells)
        if (cell.kind === "chord")
          console.log(JSON.stringify(normalize(cell.symbol)));
} else if (cmd === "html") console.log(renderChartToHTML(ast, { normalize, lenient: true }));
else { console.error(`unknown command: ${cmd}`); process.exit(1); }
