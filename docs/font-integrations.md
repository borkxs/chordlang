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
| **LibreOffice Writer** | HarfBuzz | [`libreoffice-chords.fodt`](../examples/integrations/libreoffice-chords.fodt) | Live typing engraves in-app; headless `--convert-to pdf` works too |
| **Inkscape** | Pango/HarfBuzz | [`inkscape-chords.svg`](../examples/integrations/inkscape-chords.svg) | SVG `font-family` text engraves; CLI `--export-type=png` verified |
| **GIMP** | Pango/HarfBuzz | comma trick, see gotcha 2 | Text tool + script-fu (`gimp-text-fontname`) |
| **Qt / QPainter** | HarfBuzz | `QFont("ChordFont-Real Book")` | Any Qt app's text rendering — verified with a 10-line PyQt script |
| **Pango CLI** (`pango-view`) | HarfBuzz | one-liner below | Stand-in for every GTK app (gedit, file managers, …) |
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

## OS-level: the font is the integration

Installing the TTF at the OS level makes ChordFont appear in the font menu of
**every native app** — nothing chordlang-specific needs to exist in any of
them. The shaping engine lives in the OS text stack, so a text box in a word
processor engraves the same symbols as the web playground:

| Platform | Install | Shaper apps inherit |
|----------|---------|---------------------|
| Linux | `cp *.ttf ~/.fonts/ && fc-cache -f` | HarfBuzz (Pango/GTK, Qt, LibreOffice) |
| macOS / iOS | double-click → Font Book; iOS via font-provider apps | CoreText — `liga`/`calt` on by default |
| Windows | right-click → Install | DirectWrite — `liga` on by default; `calt` varies by app |
| Android | per-app (font pickers, WebView) | Minikin/HarfBuzz |

Verified here on Linux: typing `Cmaj7` into a **LibreOffice Writer** document
with ChordFont selected engraves C△7 live, mid-keystroke — the `maj`→△
ligature forms the moment the `j` lands. The same document converts to PDF
headlessly. Inkscape, GIMP, and a raw Qt `QPainter` render all engrave from
the same `~/.fonts` install.

## Likely-to-work (same shaper, not yet verified)

- **Pandoc PDF output** — delegates to XeLaTeX/LuaLaTeX (verified above);
  set `mainfont`/`fontfamily` per section.
- **ImageMagick** — uses Pango when built with it (`magick pango:...`).
- **Krita, Scribus ≥ 1.5.4, Blender ≥ 3.4 (VSE text)** — HarfBuzz.
- **Kdenlive / Shotcut title clips** — Qt text rendering (QPainter verified
  above).
- **macOS/iOS apps** (Pages, Keynote, Notes, Final Cut titles) — CoreText
  applies `liga`/`calt` by default.
- **Windows apps on DirectWrite** (Word, PowerPoint) — `liga` on by default;
  `calt` support varies by app.
- **Electron apps with font settings** (Obsidian, VS Code markdown preview) —
  Chromium shaping, same as the playground.
- **MuseScore** — Qt-based; it has a dedicated "chord symbol font" style
  setting, but also its own chord-symbol formatter that may pre-transform
  text before shaping — needs a real test.
- **OBS Studio** — Pango text source on Linux engraves; the default
  FreeType 2 source on Windows does not shape, use the Pango plugin.

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
score (LilyPond), a poster (Inkscape), a word-processor lead sheet
(LibreOffice), or a video overlay (ffmpeg) — unchanged.
