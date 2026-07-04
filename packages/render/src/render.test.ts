import { describe, it, expect } from "vitest";
import { renderChartToHTML } from "./index";
import { parseChart } from "@chordlang/parse";
import { normalize } from "@chordlang/chord";

describe("renderChartToHTML", () => {
  it("emits ascii symbols for the font to engrave, harte in data attr", () => {
    const html = renderChartToHTML(parseChart("{title: Test}\n[A]\n| Cmaj7 | F#m7b5,B7 |"), { normalize });
    expect(html).toContain(`<h2 class="chordlang-title">Test</h2>`);
    expect(html).toContain(`class="chordlang-section-row"`);
    expect(html).toContain(`class="chordlang-section"`);
    expect(html).toContain(`data-harte="C:maj7">Cmaj7</span>`);
    expect(html).toContain(`data-harte="F#:hdim7">F#m7b5</span>`);
    const bars = html.match(/chordlang-bar[\s"]/g);
    expect(bars).toHaveLength(2);
  });
  it("lenient mode renders unparseable tokens with error class", () => {
    const html = renderChartToHTML(parseChart("| Xyzzy9 |"), { normalize, lenient: true });
    expect(html).toContain("chordlang-error");
  });
});
