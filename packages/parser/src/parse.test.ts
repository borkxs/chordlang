import { describe, it, expect } from "vitest";
import { parseChart } from "./index";

describe("parseChart", () => {
  it("parses directives, sections, bars, comma subdivisions", () => {
    const ast = parseChart(`
{title: Walkin Thing}
{key: Dm}
[A]
| Dm7 | Bh7,Bb7 | Dm7/A | G7 |
`);
    expect(ast.directives).toEqual([
      { key: "title", value: "Walkin Thing" },
      { key: "key", value: "Dm" },
    ]);
    const bars = ast.body.filter((b) => b.type === "bar");
    expect(ast.body[0]).toEqual({ type: "section", label: "A" });
    expect(bars).toHaveLength(4);
    expect(bars[1]).toEqual({
      type: "bar",
      cells: [
        { kind: "chord", symbol: "Bh7" },
        { kind: "chord", symbol: "Bb7" },
      ],
    });
    expect(bars[2].cells[0]).toEqual({ kind: "chord", symbol: "Dm7/A" });
  });

  it("supports % / :/: repeat and . hold cells", () => {
    const ast = parseChart("| Cmaj7 | % | Cmaj7,. | :/: |");
    const bars = ast.body.filter((b) => b.type === "bar");
    expect(bars[1].cells).toEqual([{ kind: "repeat" }]);
    expect(bars[2].cells).toEqual([
      { kind: "chord", symbol: "Cmaj7" },
      { kind: "hold" },
    ]);
    expect(bars[3].cells).toEqual([{ kind: "repeat" }]);
  });

  it("chord tokens stay opaque (grammar never interprets symbols)", () => {
    const ast = parseChart("| F#m7b5 |");
    const bar = ast.body[0] as any;
    expect(bar.cells[0].symbol).toBe("F#m7b5");
  });
});
