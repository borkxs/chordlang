import uharfbuzz as hb
import pytest
from fontTools.ttLib import TTFont

FONT = "dist/ChordProof.ttf"
order = TTFont(FONT).getGlyphOrder()
_data = open(FONT, "rb").read()
_font = hb.Font(hb.Face(_data))


def shape(s):
    b = hb.Buffer()
    b.add_str(s)
    b.guess_segment_properties()
    hb.shape(_font, b, {"liga": True, "calt": True})
    return " ".join(order[i.codepoint] for i in b.glyph_infos)


CASES = {
    "Cmaj7": "C maj.tri d7.sup",
    "Dm7b5": "D m d7.sup flat.alt d5.sup",
    "F#m7": "F sharp.root m d7.sup",
    "G13": "G d1.sup d3.sup",
    "Bb": "B flat.root",
    "Bm7b5": "B m d7.sup flat.alt d5.sup",
    "Em7b5": "E m d7.sup flat.alt d5.sup",
    "Fmaj7": "F maj.tri d7.sup",
    "Bb7": "B flat.root d7.sup",
    "Eb7": "E flat.root d7.sup",
    "F#m7b5": "F sharp.root m d7.sup flat.alt d5.sup",
    "Dm7/A": "D m d7.sup slash.sup A",
    "C7alt": "C d7.sup a.sup l.sup t.sup",
    "F#o7": "F sharp.root dim.ring d7.sup",
    "C6/9": "C d6.sup slash.sup d9.sup",
    "Cdim7": "C dim.ring d7.sup",
    "Csus4": "C s u s d4.sup",
    "Cadd9": "C a d.lc d.lc d9.sup",
    "C13b9": "C d1.sup d3.sup flat.alt d9.sup",
    "E7b5": "E d7.sup flat.alt d5.sup",
    "E7#5": "E d7.sup sharp.alt d5.sup",
    "Eb7b5": "E flat.root d7.sup flat.alt d5.sup",
    "Bbmaj7": "B flat.root maj.tri d7.sup",
}


@pytest.mark.parametrize("inp,expected", CASES.items(), ids=list(CASES.keys()))
def test_shape(inp, expected):
    assert shape(inp) == expected
