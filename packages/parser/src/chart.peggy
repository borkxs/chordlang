// =====================================================================
// chordlang chart grammar — THIS FILE IS THE FORMAT SPEC.
// The grammar parses chart STRUCTURE only. Chord tokens are opaque
// strings handed to @chordlang/chord for normalization. (ADR-003)
//
// Borrowed conventions (design references, no code imported):
//   - comma bar-subdivision: QuickChords / iReal Pro
//   - {key: value} directives: ChordPro
//   - [A] section labels: iReal-style form markers
// =====================================================================

Chart
  = _ dirs:Directive* body:Body _
    { return { type: "chart", directives: dirs, body }; }

Directive
  = "{" _ k:Ident _ ":" _ v:$[^}]+ "}" _
    { return { key: k, value: v.trim() }; }

Body
  = items:(Section / BarLine)*
    { return items; }

// [A] [B] [Intro] [Coda] — form-section markers
Section
  = "[" label:$[A-Za-z0-9 ]+ "]" _
    { return { type: "section", label: label.trim() }; }

// A run of bars: | Cmaj7 | Dm7,G7 | ... |  (trailing barline optional-ish:
// each bar is opened by "|"; a final lone "|" is consumed harmlessly)
BarLine
  = "|" _ cells:CellList? _ &{ return true; }
    { return cells === null
        ? { type: "barline-end" }
        : { type: "bar", cells }; }

CellList
  = first:Cell rest:("," _ c:Cell { return c; })*
    { return [first, ...rest]; }

// A cell is one beat-slot in the bar. Equal division by default.
// "%" = repeat previous bar's chord (iReal convention). "." = hold/empty slot.
Cell
  = "%" _ { return { kind: "repeat" }; }
  / "." _ { return { kind: "hold" }; }
  / c:ChordToken _ { return { kind: "chord", symbol: c }; }

// Opaque chord symbol — everything the grammar does NOT interpret.
ChordToken
  = $([^,|{}\[\] \t\r\n%.][^,|{}\[\] \t\r\n]*)
    { return text(); }

Ident
  = $([a-zA-Z_][a-zA-Z0-9_]*)

_ "whitespace"
  = [ \t\r\n]*
