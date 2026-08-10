import { describe, it, expect } from "vitest";
import { normalize } from "./index";

describe("normalize — the five stress chords", () => {
  it("Cmaj7 -> major-seventh with △ display", () => {
    const c = normalize("Cmaj7");
    expect(c.root).toEqual({ letter: "C", accidental: 0 });
    expect(c.factors).toEqual([
      { degree: 1, semitones: 0 },
      { degree: 3, semitones: 4 },
      { degree: 5, semitones: 7 },
      { degree: 7, semitones: 11 },
    ]);
    expect(c.render.display).toBe("C△7");
    expect(c.render.harte).toBe("C:maj7");
    expect(c.render.musicxmlKind).toBe("major-seventh");
    expect(c.underspecified).toBe(false);
  });

  it("F#m7b5 and F#ø7 normalize IDENTICALLY (the tonal/music21 disagreement)", () => {
    const a = normalize("F#m7b5");
    const b = normalize("F#ø7");
    expect(a.factors).toEqual(b.factors);
    expect(a.render.harte).toBe("F#:hdim7");
    expect(b.render.harte).toBe("F#:hdim7");
    expect(a.render.display).toBe("F♯ø7");
    expect(a.render.musicxmlKind).toBe("half-diminished");
    expect(a.factors).toEqual([
      { degree: 1, semitones: 0 },
      { degree: 3, semitones: 3 },
      { degree: 5, semitones: 6 },
      { degree: 7, semitones: 10 },
    ]);
  });

  it("C7alt -> underspecified, does NOT fabricate a voicing", () => {
    const c = normalize("C7alt");
    expect(c.underspecified).toBe(true);
    expect(c.underspecToken).toBe("alt");
    expect(c.altPool).toEqual(["b9", "#9", "#11", "b13"]);
    // only the certain dominant core survives
    expect(c.factors).toEqual([
      { degree: 1, semitones: 0 },
      { degree: 3, semitones: 4 },
      { degree: 7, semitones: 10 },
    ]);
    expect(c.render.display).toBe("C7alt");
    expect(c.render.musicxmlKind).toBe("dominant");
  });

  it("C/E -> bassRole inversion; C/D -> bassRole added", () => {
    const inv = normalize("C/E");
    expect(inv.bass).toEqual({ letter: "E", accidental: 0 });
    expect(inv.bassRole).toBe("inversion");
    const add = normalize("C/D");
    expect(add.bass).toEqual({ letter: "D", accidental: 0 });
    expect(add.bassRole).toBe("added");
  });

  it("C6/9 -> sixth-added-ninth, /9 is NOT a bass note", () => {
    const c = normalize("C6/9");
    expect(c.bass).toBeNull();
    expect(c.factors).toContainEqual({ degree: 6, semitones: 9 });
    expect(c.factors).toContainEqual({ degree: 9, semitones: 14 });
    expect(c.render.display).toBe("C6/9");
  });

  it("C7b13 -> dominant with flat 13", () => {
    const c = normalize("C7b13");
    expect(c.root).toEqual({ letter: "C", accidental: 0 });
    expect(c.factors).toContainEqual({ degree: 7, semitones: 10 });
    expect(c.factors).toContainEqual({ degree: 13, semitones: 20 });
    expect(c.render.display).toBe("C7♭13");
    expect(c.render.harte).toBe("C:7(b13)");
    expect(c.render.ascii).toBe("C7b13");
    expect(c.render.musicxmlKind).toBe("dominant");
    expect(c.underspecified).toBe(false);
  });

  it("G7b13 -> same quality, different root", () => {
    const c = normalize("G7b13");
    expect(c.root).toEqual({ letter: "G", accidental: 0 });
    expect(c.render.display).toBe("G7♭13");
    expect(c.render.harte).toBe("G:7(b13)");
    expect(c.render.musicxmlKind).toBe("dominant");
  });

  it("Bm7b13 -> minor 7 with flat 13 (tonal decomposition fallback)", () => {
    const c = normalize("Bm7b13");
    expect(c.root).toEqual({ letter: "B", accidental: 0 });
    expect(c.factors).toContainEqual({ degree: 3, semitones: 3 });
    expect(c.factors).toContainEqual({ degree: 7, semitones: 10 });
    expect(c.factors).toContainEqual({ degree: 13, semitones: 20 });
    expect(c.render.display).toBe("Bm7♭13");
    expect(c.render.harte).toBe("B:min7(b13)");
    expect(c.render.ascii).toBe("Bm7b13");
    expect(c.render.musicxmlKind).toBe("minor-seventh");
    expect(c.underspecified).toBe(false);
  });

  it("dialect folds: C-7, CΔ7, C^7 all resolve", () => {
    expect(normalize("C-7").render.harte).toBe("C:min7");
    expect(normalize("CΔ7").render.harte).toBe("C:maj7");
    expect(normalize("C^7").render.harte).toBe("C:maj7");
  });

  it("Eadd4 / Cadd11 — major add4/add11 (tonal gap; keep 3rd)", () => {
    const add4 = normalize("Eadd4");
    expect(add4.root).toEqual({ letter: "E", accidental: 0 });
    expect(add4.factors).toEqual([
      { degree: 1, semitones: 0 },
      { degree: 3, semitones: 4 },
      { degree: 5, semitones: 7 },
      { degree: 4, semitones: 5 },
    ]);
    expect(add4.render.display).toBe("Eadd4");
    expect(add4.render.harte).toBe("E:add4");
    expect(add4.render.ascii).toBe("Eadd4");

    const add11 = normalize("Cadd11");
    expect(add11.factors).toContainEqual({ degree: 11, semitones: 17 });
    expect(add11.factors).toContainEqual({ degree: 3, semitones: 4 });
    expect(add11.render.harte).toBe("C:add11");
  });
});
