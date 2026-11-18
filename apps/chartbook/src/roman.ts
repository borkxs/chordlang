/** Roman-numeral analysis of a canonical chord against a key. */
import type { Canonical, NoteRef } from "@chordlang/chord";

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"];

export interface Key {
  tonic: NoteRef;
  minor: boolean;
}

/** "Dm", "F", "Bb", "F#m", "G major", "A minor", "Eb-" */
export function parseKey(s: string | null | undefined): Key | null {
  if (!s) return null;
  const m = s.trim().match(/^([A-Ga-g])([#b♯♭]?)\s*(m|min|minor|-|maj|major|M)?$/);
  if (!m) return null;
  const letter = m[1].toUpperCase() as NoteRef["letter"];
  const acc = m[2] === "#" || m[2] === "♯" ? 1 : m[2] === "b" || m[2] === "♭" ? -1 : 0;
  const q = m[3] || "";
  const minor = q === "m" || q === "min" || q === "minor" || q === "-";
  return { tonic: { letter, accidental: acc }, minor };
}

function pc(n: NoteRef): number {
  return (LETTER_PC[n.letter] + n.accidental + 24) % 12;
}

function degree(n: NoteRef, key: Key): { idx: number; acc: number } {
  const li = LETTERS.indexOf(n.letter);
  const ti = LETTERS.indexOf(key.tonic.letter);
  const idx = (li - ti + 7) % 7;
  const expected = (key.minor ? MINOR : MAJOR)[idx];
  let diff = ((pc(n) - pc(key.tonic) + 12) % 12) - expected;
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  return { idx, acc: diff };
}

const accStr = (a: number): string => (a < 0 ? "♭".repeat(-a) : "♯".repeat(a));

export interface Roman {
  numeral: string;
  suffix: string;
  bass: string | null;
  text: string;
}

export function toRoman(c: Canonical, key: Key): Roman {
  const d = degree(c.root, key);
  let rest = c.render.ascii.replace(/^[A-G](?:#|b)?/, "");
  if (c.bass) {
    const i = rest.lastIndexOf("/");
    if (i >= 0) rest = rest.slice(0, i);
  }
  let lower = false;
  let suffix: string;
  if (/^dim/.test(rest)) {
    lower = true;
    suffix = "°" + rest.slice(3);
  } else if (/^m7b5/.test(rest)) {
    lower = true;
    suffix = "ø7" + rest.slice(4);
  } else if (/^ø/.test(rest)) {
    lower = true;
    suffix = rest;
  } else if (/^m(?!aj)/.test(rest)) {
    lower = true;
    suffix = rest.slice(1);
  } else if (/^aug/.test(rest)) {
    suffix = "+" + rest.slice(3);
  } else {
    suffix = rest;
  }
  suffix = suffix
    .replace(/maj7/g, "△7")
    .replace(/maj/g, "△")
    .replace(/b(?=\d)/g, "♭")
    .replace(/#(?=\d)/g, "♯");
  let numeral = accStr(d.acc) + NUMERALS[d.idx];
  if (lower) numeral = numeral.toLowerCase();
  let bass: string | null = null;
  if (c.bass) {
    const b = degree(c.bass, key);
    bass = accStr(b.acc) + String(b.idx + 1);
  }
  return { numeral, suffix, bass, text: numeral + suffix + (bass ? "/" + bass : "") };
}
