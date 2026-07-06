/**
 * Exhaustive ChordFont symbol catalog.
 *
 * Single source of truth for the font atlas: every root spelling × every
 * supported ASCII suffix pattern. Enharmonic pairs (C#/Db) are both included
 * so sharp.root and flat.root ligatures get exercised.
 *
 * Keep in sync with packages/font/tests/shape_test.py when adding features.
 */

export interface SymbolGroup {
  /** Section heading in the atlas */
  name: string;
  /** Suffix appended to each root (empty string = bare triad) */
  suffixes: readonly string[];
}

/** All pitch-class spellings the font must shape correctly */
export const ROOTS = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
] as const;

/**
 * Suffix groups mirror how musicians think about symbol families.
 * Order within each group is stable for visual diffing across font builds.
 */
export const SYMBOL_GROUPS: readonly SymbolGroup[] = [
  {
    name: "Triads & basic qualities",
    suffixes: ["", "maj", "m", "dim", "aug", "+", "o", "sus4", "sus2", "add9"],
  },
  {
    name: "Sevenths",
    suffixes: ["maj7", "m7", "7", "m7b5", "dim7", "o7"],
  },
  {
    name: "Sixths",
    suffixes: ["6", "m6", "6/9"],
  },
  {
    name: "Ninths & upper extensions",
    suffixes: ["9", "maj9", "m9", "11", "13", "13b9"],
  },
  {
    name: "Dominant alterations",
    suffixes: ["7b9", "7#9", "7b13", "7#13", "7#11", "7b11", "7b5", "7#5", "7alt"],
  },
  {
    name: "Sus & add dominants",
    suffixes: ["7sus4", "9sus4", "13sus4", "7add9", "maj7#11"],
  },
  {
    name: "Slash bass (fixed bass pitch — tests slash.sup on every root)",
    suffixes: ["m7/A", "maj7/E", "7/G", "dim7/B", "6/9"],
  },
] as const;

export interface AtlasEntry {
  symbol: string;
  group: string;
  suffix: string;
  root: string;
}

/** Flat list of every root × suffix combination, grouped for rendering */
export function buildAtlasEntries(): AtlasEntry[] {
  const entries: AtlasEntry[] = [];
  for (const group of SYMBOL_GROUPS) {
    for (const suffix of group.suffixes) {
      for (const root of ROOTS) {
        entries.push({ symbol: root + suffix, group: group.name, suffix, root });
      }
    }
  }
  return entries;
}

/** Unique symbols only (dedupes 6/9 appearing in two groups) */
export function buildUniqueSymbols(): string[] {
  return [...new Set(buildAtlasEntries().map((e) => e.symbol))];
}
