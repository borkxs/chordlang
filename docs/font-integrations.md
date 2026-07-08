# ChordFont in other tools — free integrations

ChordFont does its engraving inside the text shaping engine (GSUB `liga` +
`calt`). That means **any tool that shapes text with HarfBuzz, CoreText, or
DirectWrite gets engraved chord symbols for free** — no plugin, no renderer,
no code. Graphviz was the first proof (`.cfgv` graphs set
`fontname="ChordFont"` and the symbols engrave themselves). This page lists
other tools where the same trick is verified to work, with runnable sources
in [`examples/integrations/`](../examples/integrations/).

## Verified

| Tool | Shaper | Source | Notes |
|------|--------|--------|-------|
| **Graphviz** | Pango/HarfBuzz | [`examples/graphs/`](../examples/graphs/) | The original proof — `.cfgv` pipeline |
| **XeLaTeX** | HarfBuzz (built in) | [`latex-chords.tex`](../examples/integrations/latex-chords.tex) | `fontspec` with `Ligatures=Common, Contextuals=Alternate` |
| **LuaLaTeX** | HarfBuzz (opt in) | [`latex-chords.tex`](../examples/integrations/latex-chords.tex) | Requires `Renderer=Harfbuzz`; the default node shaper misses the `maj`→△ ligature |
| **Typst** | rustybuzz | [`typst-chords.typ`](../examples/integrations/typst-chords.typ) | Zero config — `text(font: "ChordFont-Real Book")` |
| **LilyPond** | Pango/HarfBuzz | [`lilypond-chords.ly`](../examples/integrations/lilypond-chords.ly) | Chord symbols above real staves via `\markup` |
| **Pango CLI** (`pango-view`) | HarfBuzz | one-liner below | Stand-in for every GTK app (Inkscape, GIMP text tool, …) |
| **ffmpeg `drawtext`** | HarfBuzz | one-liner below | Engraved chord overlays on video (practice-along tracks) |

```bash
pango-view --font="ChordFont-Real Book, 32" --text="Cmaj7 Dm7b5 F#m7 G13 Bb7"
```

```bash
ffmpeg -f lavfi -i color=c=black:s=1280x360:d=1 \
  -vf "drawtext=fontfile='ChordFont-Real Book.ttf':text='Cmaj7  Dm7b5  G13':fontsize=96:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
  -frames:v 1 chords.png
```

All of these were validated against the `hb-shape` ground truth used by the
shaping tests (`packages/font/tests/shape_test.py`).

## Gotchas discovered while verifying

These are real-world consumers' requirements the browser never exercised:

1. **Name table completeness.** LuaLaTeX's HarfBuzz loader, Typst's font
   discovery, and LilyPond's PS backend all require full name (ID 4) and
   PostScript name (ID 6) records. The build now emits IDs 3–6
   (`src/build_font.py`); fonts built before this fix render blank or crash
   `luaotfload` in those tools.
2. **Fontconfig family parsing.** `ChordFont-Real Book` contains a hyphen
   *and* a space, which fontconfig's pattern syntax misparses. Append a comma
   to terminate the family name: `"ChordFont-Real Book,"` (Pango, LilyPond) —
   or load by file path (LaTeX `Path=`, Typst `--font-path`).
3. **LuaLaTeX's default shaper is not HarfBuzz.** The node renderer handles
   single-substitution fine but drops the multi-glyph `maj`→△ ligature.
   Always pass `Renderer=Harfbuzz` in `fontspec` options.

## Likely-to-work (same shaper, not yet verified)

- **Inkscape / GIMP / any GTK app** — Pango everywhere; `pango-view` above is
  the smoke test.
- **LibreOffice** — uses HarfBuzz on all platforms since 5.3.
- **Pandoc PDF output** — delegates to XeLaTeX/LuaLaTeX (verified above);
  set `mainfont`/`fontfamily` per section.
- **ImageMagick** — uses Pango when built with it (`magick pango:...`).
- **Krita, Scribus ≥ 1.5.4, Blender ≥ 3.4 (VSE text)** — HarfBuzz.
- **macOS/iOS apps** (Pages, Keynote, Final Cut titles) — CoreText applies
  `liga`/`calt` by default.
- **Windows apps on DirectWrite** (Word, PowerPoint) — `liga` on by default;
  `calt` support varies by app.

## Verified NOT to work

- **libass subtitles** (`ffmpeg -vf subtitles=…`) — libass finds the font but
  does not run the `liga`/`calt` features, so symbols come out as raw ASCII.
  Use `drawtext` for video overlays instead.
- **Terminal emulators** — most force monospace metrics and many disable
  ligatures, so composed symbols (which change advance widths) will not
  survive.

## Why this matters

Every row in the tables above is an integration chordlang never has to build
or maintain. The font is the API; the OS text stack is the runtime. The same
`.ttf` that powers the web playground drops into a dissertation (LaTeX), a
score (LilyPond), a poster (Inkscape), or a slide deck — unchanged.
