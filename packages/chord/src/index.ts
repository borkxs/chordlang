/**
 * @chordlang/chord — chord-symbol normalizer.
 *
 * Strategy (ADR-002): we do NOT write a chord parser. @tonaljs/chord does the
 * heavy lifting; this package is a thin pre-fold (collapse dialect variants
 * before tonal sees the string) and post-fold (map tonal output to our
 * canonical struct, fixing tonal's known gaps):
 *   - `7alt` : tonal silently fabricates a specific voicing (7#5#9). We flag
 *     underspecified instead and keep only the certain dominant core.
 *   - half-diminished naming: `ø7` and `m7b5` must normalize identically.
 *   - major `add4` / `add11`: tonal only ships `madd4` / `m7add4`; we keep the
 *     major third and add P4 / P11.
 */
import { Chord } from "tonal";

export type Letter = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export interface ChordFactor {
  /** scale degree: 1,3,5,7,9,11,13 (2/4/6 appear for sus/6 chords) */
  degree: number;
  /** semitones above root */
  semitones: number;
}

export interface NoteRef {
  letter: Letter;
  /** -1 = flat, 0 = natural, +1 = sharp (±2 for double) */
  accidental: number;
}

export type BassRole = "inversion" | "added" | "polychord" | null;

export interface Canonical {
  input: string;
  root: NoteRef;
  factors: ChordFactor[];
  bass: NoteRef | null;
  bassRole: BassRole;
  underspecified: boolean;
  underspecToken?: string;
  altPool?: string[];
  render: {
    ascii: string;
    display: string;
    harte: string;
    musicxmlKind: string;
  };
}

/* ------------------------------------------------------------------ */
/* pre-fold: dialect variants -> the form tonal parses most reliably   */
/* ------------------------------------------------------------------ */

const PRE_FOLDS: Array<[RegExp, string]> = [
  [/[Δ△^]/g, "maj"], // CΔ7, C^7, C△ -> Cmaj7 family
  [/ø7?/g, "m7b5"], // half-diminished glyph -> factor-equivalent ascii
  [/°/g, "dim"],
  [/(?<=[A-G][#b]?)-(?=\d|$|\/)/g, "m"], // C-7 -> Cm7 (jazz minus-minor)
];

function preFold(symbol: string): { folded: string; alt: boolean } {
  let s = symbol.trim();
  let alt = false;
  const altMatch = s.match(/^([A-G][#b]?)(7?)alt$/i);
  if (altMatch) {
    alt = true;
    s = `${altMatch[1]}7`; // keep only the certain dominant-7 core
  }
  for (const [re, to] of PRE_FOLDS) s = s.replace(re, to);
  return { folded: s, alt };
}

/* ------------------------------------------------------------------ */
/* interval -> {degree, semitones}                                      */
/* ------------------------------------------------------------------ */

const MAJOR_SEMITONES: Record<number, number> = {
  1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11,
  8: 12, 9: 14, 10: 16, 11: 17, 12: 19, 13: 21,
};
const PERFECT = new Set([1, 4, 5, 8, 11, 12]);

function intervalToFactor(ivl: string): ChordFactor {
  const m = ivl.match(/^(\d+)([PMmAd]+)$/);
  if (!m) throw new Error(`Unrecognized interval: ${ivl}`);
  const num = parseInt(m[1], 10);
  const q = m[2];
  let semis = MAJOR_SEMITONES[num];
  if (semis === undefined) throw new Error(`Interval number out of range: ${ivl}`);
  if (q === "m") semis -= 1;
  else if (q === "A") semis += 1;
  else if (q === "AA") semis += 2;
  else if (q === "d") semis -= PERFECT.has(num) ? 1 : 2;
  else if (q === "dd") semis -= PERFECT.has(num) ? 2 : 3;
  // P and M are the base
  return { degree: num, semitones: semis };
}

/* ------------------------------------------------------------------ */
/* note-name helpers                                                    */
/* ------------------------------------------------------------------ */

function toNoteRef(name: string): NoteRef {
  const m = name.match(/^([A-G])(#{1,2}|b{1,2})?/);
  if (!m) throw new Error(`Bad note name: ${name}`);
  const acc = m[2] ?? "";
  return {
    letter: m[1] as Letter,
    accidental: acc.startsWith("#") ? acc.length : acc ? -acc.length : 0,
  };
}

function refToDisplay(n: NoteRef): string {
  return n.letter + (n.accidental > 0 ? "♯".repeat(n.accidental) : "♭".repeat(-n.accidental));
}
function refToAscii(n: NoteRef): string {
  return n.letter + (n.accidental > 0 ? "#".repeat(n.accidental) : "b".repeat(-n.accidental));
}

/* ------------------------------------------------------------------ */
/* signature -> naming maps (display / harte / musicxml)                */
/* ------------------------------------------------------------------ */

function signature(factors: ChordFactor[]): string {
  return factors
    .map((f) => `${f.degree}:${f.semitones}`)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .join(",");
}

interface Naming { display: string; harte: string; kind: string }

/** keyed by factor signature; display glyph conventions: △ ø ° + ♯ ♭ */
const NAMES: Record<string, Naming> = {
  "1:0,3:4,5:7":              { display: "",      harte: "maj",   kind: "major" },
  "1:0,3:3,5:7":              { display: "m",     harte: "min",   kind: "minor" },
  "1:0,3:4,5:7,7:10":         { display: "7",     harte: "7",     kind: "dominant" },
  "1:0,3:4,5:7,7:11":         { display: "△7",    harte: "maj7",  kind: "major-seventh" },
  "1:0,3:3,5:7,7:10":         { display: "m7",    harte: "min7",  kind: "minor-seventh" },
  "1:0,3:3,5:6,7:10":         { display: "ø7",    harte: "hdim7", kind: "half-diminished" },
  "1:0,3:3,5:6,7:9":          { display: "°7",    harte: "dim7",  kind: "diminished-seventh" },
  "1:0,3:3,5:6":              { display: "°",     harte: "dim",   kind: "diminished" },
  "1:0,3:4,5:8":              { display: "+",     harte: "aug",   kind: "augmented" },
  "1:0,3:4,5:7,6:9":          { display: "6",     harte: "maj6",  kind: "major-sixth" },
  "1:0,3:3,5:7,6:9":          { display: "m6",    harte: "min6",  kind: "minor-sixth" },
  "1:0,3:4,5:7,6:9,9:14":     { display: "6/9",   harte: "maj6(9)", kind: "major-sixth" },
  "1:0,3:4,5:7,7:10,9:14":    { display: "9",     harte: "9",     kind: "dominant-ninth" },
  "1:0,3:4,5:7,7:11,9:14":    { display: "△9",    harte: "maj9",  kind: "major-ninth" },
  "1:0,3:3,5:7,7:10,9:14":    { display: "m9",    harte: "min9",  kind: "minor-ninth" },
  "1:0,3:4,5:7,7:10,13:20":   { display: "7♭13",  harte: "7(b13)", kind: "dominant" },
  "1:0,3:4,7:10,13:20":       { display: "7♭13",  harte: "7(b13)", kind: "dominant" },
  "1:0,3:3,5:7,7:10,13:20":   { display: "m7♭13", harte: "min7(b13)", kind: "minor-seventh" },
  "1:0,4:5,5:7":              { display: "sus4",  harte: "sus4",  kind: "suspended-fourth" },
  "1:0,2:2,5:7":              { display: "sus2",  harte: "sus2",  kind: "suspended-second" },
  "1:0,3:4,4:5,5:7":          { display: "add4",  harte: "add4",  kind: "other" },
  "1:0,3:4,5:7,11:17":        { display: "add11", harte: "add11", kind: "other" },
};

function nameFactors(factors: ChordFactor[], asciiTail: string): Naming {
  const hit = NAMES[signature(factors)];
  if (hit) return hit;
  // Fallback: keep the typed tail for display; harte/kind get best-effort.
  return { display: asciiTail, harte: asciiTail, kind: "other" };
}

/* ------------------------------------------------------------------ */
/* extension decomposition — handle suffixes tonal doesn't recognize   */
/* ------------------------------------------------------------------ */

const EXTENSION_SUFFIXES: Array<{ re: RegExp; factor: ChordFactor }> = [
  { re: /b13$/, factor: { degree: 13, semitones: 20 } },
  { re: /#13$/, factor: { degree: 13, semitones: 22 } },
  { re: /b9$/,  factor: { degree: 9,  semitones: 13 } },
  { re: /#9$/,  factor: { degree: 9,  semitones: 15 } },
  { re: /#11$/, factor: { degree: 11, semitones: 18 } },
  { re: /b11$/, factor: { degree: 11, semitones: 16 } },
  // tonal knows madd4 / m7add4 but not major add4 / add11 (keep 3rd, add P4/P11)
  { re: /add11$/, factor: { degree: 11, semitones: 17 } },
  { re: /add4$/, factor: { degree: 4, semitones: 5 } },
];

function decomposeChord(chordPart: string): { parsed: ReturnType<typeof Chord.get>; extra: ChordFactor | null } {
  const direct = Chord.get(chordPart);
  if (!direct.empty && direct.tonic) return { parsed: direct, extra: null };
  for (const { re, factor } of EXTENSION_SUFFIXES) {
    if (!re.test(chordPart)) continue;
    const base = chordPart.replace(re, "");
    const attempt = Chord.get(base);
    if (!attempt.empty && attempt.tonic) return { parsed: attempt, extra: factor };
  }
  return { parsed: direct, extra: null };
}

/* ------------------------------------------------------------------ */
/* main entry                                                           */
/* ------------------------------------------------------------------ */

const ALT_POOL = ["b9", "#9", "#11", "b13"];

export function normalize(symbol: string): Canonical {
  const { folded, alt } = preFold(symbol);

  // Split a slash-BASS (a note name after "/") off before parsing, so tonal
  // returns root-relative intervals. "C6/9" keeps its slash: 9 is a degree,
  // not a note — the letter test disambiguates the overloaded "/".
  const bassMatch = folded.match(/^(.*)\/([A-G][#b]{0,2})$/);
  const chordPart = bassMatch ? bassMatch[1] : folded;
  const bassName = bassMatch ? bassMatch[2] : null;

  const { parsed: c, extra } = decomposeChord(chordPart);
  if (c.empty || !c.tonic) {
    throw new Error(`Cannot parse chord symbol: ${JSON.stringify(symbol)} (folded: ${JSON.stringify(folded)})`);
  }

  const root = toNoteRef(c.tonic);
  const factors = c.intervals.map(intervalToFactor);
  if (extra) factors.push(extra);

  // bass + role: inversion iff the bass pitch-class is a chord tone
  let bass: NoteRef | null = null;
  let bassRole: BassRole = null;
  if (bassName) {
    bass = toNoteRef(bassName);
    const chordPcs = c.notes.map((n: string) => n.replace(/\d+$/, ""));
    bassRole = chordPcs.includes(bassName) ? "inversion" : "added";
  }

  const asciiTail = chordPart.replace(/^[A-G][#b]{0,2}/, "");
  const naming = nameFactors(factors, asciiTail);

  const rootAscii = refToAscii(root);
  const rootDisplay = refToDisplay(root);
  const bassAsciiSuffix = bass ? `/${refToAscii(bass)}` : "";
  const bassDisplaySuffix = bass ? `/${refToDisplay(bass)}` : "";

  if (alt) {
    return {
      input: symbol,
      root,
      factors: factors.filter((f) => [1, 3, 7].includes(f.degree)),
      bass,
      bassRole,
      underspecified: true,
      underspecToken: "alt",
      altPool: ALT_POOL,
      render: {
        ascii: `${rootAscii}7alt`,
        display: `${rootDisplay}7alt`,
        harte: `${rootAscii}:7`,
        musicxmlKind: "dominant",
      },
    };
  }

  return {
    input: symbol,
    root,
    factors,
    bass,
    bassRole,
    underspecified: false,
    render: {
      ascii: rootAscii + asciiTail + bassAsciiSuffix,
      display: rootDisplay + naming.display + bassDisplaySuffix,
      harte: `${rootAscii}:${naming.harte}${bass ? `/${refToAscii(bass)}` : ""}`,
      musicxmlKind: naming.kind,
    },
  };
}
