// ChordFont in Typst — Typst shapes text with rustybuzz (a HarfBuzz port),
// so liga + calt fire with zero configuration.
//
//   typst compile --font-path <dir-with-ttfs> typst-chords.typ typst-chords.pdf
//
// Point --font-path at packages/font/fonts/ (or install the TTFs system-wide).
#set page(width: auto, height: auto, margin: 12pt, fill: white)

#table(
  columns: 2,
  stroke: none,
  gutter: 8pt,
  align: (right + horizon, left + horizon),
  [Real Book:], text(font: "ChordFont-Real Book", size: 28pt)[Cmaj7 Dm7b5 F\#m7 G13 Bb7],
  [Pop:], text(font: "ChordFont-Pop", size: 28pt)[CM7 Dm7 F\#m7 G13 Bb7],
)
