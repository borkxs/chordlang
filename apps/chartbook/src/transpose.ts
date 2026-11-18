/**
 * Spelled transposition over @chordlang/chord canonical chords. An interval is
 * carried as diatonic letter steps plus semitones so that a chart moved from
 * Bm to Em keeps its spelling (F# → C#, not Db). Double accidentals that fall
 * out of a shift are respelled to the nearest single-accidental letter.
 */
import { normalize, type Canonical, type Letter, type NoteRef } from "@chordlang/chord";
import type { Key } from "./roman";

const LETTERS: Letter[] = ["C", "D", "E", "F", "G", "A", "B"];
const LETTER_PC: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export interface Interval {
  /** diatonic letter steps upward, 0..6 */
  steps: number;
  /** semitones upward, 0..11 */
  semitones: number;
}

const pc = (n: NoteRef): number => (LETTER_PC[n.letter] + n.accidental + 24) % 12;

const wrap = (d: number): number => (d > 6 ? d - 12 : d < -6 ? d + 12 : d);

export function intervalBetween(from: NoteRef, to: NoteRef): Interval {
  return {
    steps: (LETTERS.indexOf(to.letter) - LETTERS.indexOf(from.letter) + 7) % 7,
    semitones: (pc(to) - pc(from) + 12) % 12,
  };
}

export const isUnison = (iv: Interval): boolean => iv.steps === 0 && iv.semitones === 0;

export function transposeNote(n: NoteRef, iv: Interval): NoteRef {
  const letter = LETTERS[(LETTERS.indexOf(n.letter) + iv.steps) % 7];
  const target = (pc(n) + iv.semitones) % 12;
  const acc = wrap(target - LETTER_PC[letter]);
  if (Math.abs(acc) <= 1) return { letter, accidental: acc };
  // Respell: the letter whose natural pitch is nearest the target, flats if the
  // shift produced a double flat, sharps for a double sharp.
  const prefer = acc < 0 ? -1 : 1;
  const candidates = LETTERS.map((l) => ({ letter: l, accidental: wrap(target - LETTER_PC[l]) }))
    .filter((c) => Math.abs(c.accidental) <= 1)
    .sort((a, b) => Math.abs(a.accidental) - Math.abs(b.accidental) || (a.accidental === prefer ? -1 : 1));
  return candidates[0];
}

export function noteAscii(n: NoteRef): string {
  const a = n.accidental;
  return n.letter + (a > 0 ? "#".repeat(a) : "b".repeat(-a));
}

export function keyAscii(k: Key): string {
  return noteAscii(k.tonic) + (k.minor ? "m" : "");
}

/** The chord's canonical ASCII with root (and slash bass) moved by `iv`. */
export function transposeSymbol(c: Canonical, iv: Interval): string {
  let ascii = c.render.ascii;
  let bassTxt = "";
  if (c.bass) {
    const i = ascii.lastIndexOf("/");
    if (i >= 0) {
      ascii = ascii.slice(0, i);
      bassTxt = "/" + noteAscii(transposeNote(c.bass, iv));
    }
  }
  const head = ascii.replace(/^[A-G](?:#{1,2}|b{1,2})?/, noteAscii(transposeNote(c.root, iv)));
  return head + bassTxt;
}

export function transposeChord(symbol: string, iv: Interval): Canonical {
  return normalize(transposeSymbol(normalize(symbol), iv));
}

/**
 * Where a chart in `source` should land to sit in the same tonal centre as
 * `target`: the target key itself when the modes match, otherwise its relative
 * (a minor chart compared against G lands in Em; a major one against Bm in D).
 */
export function resolveTarget(source: Key, target: Key): Key {
  if (source.minor === target.minor) return target;
  const iv: Interval = source.minor ? { steps: 5, semitones: 9 } : { steps: 2, semitones: 3 };
  return { tonic: transposeNote(target.tonic, iv), minor: source.minor };
}
