import { describe, expect, it } from "vitest";
import { styleSvg } from "./index.js";

describe("styleSvg", () => {
  it("adds graph-svg class to root svg", () => {
    expect(styleSvg('<svg xmlns="http://www.w3.org/2000/svg">')).toBe(
      '<svg class="graph-svg" xmlns="http://www.w3.org/2000/svg">'
    );
  });
});
