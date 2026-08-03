/** Curated ChordFont builds shown in the playground specimen chrome. */

export type FontStyle = "realbook" | "pop";

export type FeatureFlags = {
  liga: boolean;
  calt: boolean;
  ss01: boolean;
  ss02: boolean;
};

export type FontBuild = {
  id: string;
  name: string;
  style: FontStyle;
  /** Filename shown in the status bar / specimen line. */
  file: string;
  /** CSS font-family registered in style.css. */
  fontFamily: string;
  flags: FeatureFlags;
};

export const FLAG_HINTS: Record<keyof FeatureFlags, string> = {
  liga: "chord ligatures",
  calt: "contextual accidentals",
  ss01: "publisher preset (planned)",
  ss02: "publisher preset (planned)",
};

export const FLAG_ORDER: (keyof FeatureFlags)[] = ["liga", "calt", "ss01", "ss02"];

/**
 * Builds are curated, tested artifacts — not a combinatorial flag playground.
 * ss01/ss02 stay off until those stylistic sets ship (ADR-010).
 */
export const BUILDS: FontBuild[] = [
  {
    id: "realbook-full",
    name: "Real Book · full",
    style: "realbook",
    file: "ChordFont-Real Book.ttf",
    fontFamily: "ChordFont-RealBook",
    flags: { liga: true, calt: true, ss01: false, ss02: false },
  },
  {
    id: "realbook-minimal",
    name: "Real Book · minimal",
    style: "realbook",
    file: "ChordFont-Real Book.ttf",
    fontFamily: "ChordFont-RealBook",
    flags: { liga: true, calt: false, ss01: false, ss02: false },
  },
  {
    id: "pop-draft",
    name: "Pop · draft",
    style: "pop",
    file: "ChordFont-Pop.ttf",
    fontFamily: "ChordFont-Pop",
    flags: { liga: true, calt: true, ss01: false, ss02: false },
  },
];

export const DEFAULT_BUILD_ID = BUILDS[0]!.id;

export function buildById(id: string): FontBuild {
  return BUILDS.find((b) => b.id === id) ?? BUILDS[0]!;
}

export function defaultBuildForStyle(style: FontStyle): FontBuild {
  return BUILDS.find((b) => b.style === style) ?? BUILDS[0]!;
}

export function activeFeatureList(flags: FeatureFlags): string {
  return FLAG_ORDER.filter((f) => flags[f]).join(" ");
}
