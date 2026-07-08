% ChordFont in LilyPond — text markup goes through Pango/HarfBuzz, so chord
% symbols above a staff engrave via the font's liga + calt features.
%
%   lilypond --png lilypond-chords.ly
%
% Install the TTFs from packages/font/fonts/ system-wide first
% (e.g. ~/.fonts/ + fc-cache -f). The trailing comma in the font-name string
% disambiguates the family for fontconfig ("ChordFont-Real Book" contains
% a hyphen AND a space).
\version "2.24.0"

\paper {
  paper-width = 150\mm
  paper-height = 34\mm
  indent = 0
  tagline = ##f
}

chord = #(define-scheme-function (txt) (string?)
  #{ \markup \override #'(font-features . ("liga" "calt"))
     \abs-fontsize #13
     \override #'(font-name . "ChordFont-Real Book,")
     #txt #})

\score {
  \new Staff {
    \time 4/4
    c'1^\chord "Cmaj7"
    d'1^\chord "Dm7b5"
    fis'1^\chord "F#m7"
    g'1^\chord "G13"
  }
}
