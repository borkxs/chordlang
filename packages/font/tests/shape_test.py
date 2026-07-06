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
    "Cmaj7": "C maj.tri d7",
    "Cmaj7#11": "C maj.tri d7 sharp.alt d1.sup d1.sup",
    "Dm7b5": "D m d7 flat.alt d5.sup",
    "F#m7": "F sharp.root m d7",
    "G13": "G d1 d3",
    "Bb": "B flat.root",
    "Bm7b5": "B m d7 flat.alt d5.sup",
    "Em7b5": "E m d7 flat.alt d5.sup",
    "Fmaj7": "F maj.tri d7",
    "Bb7": "B flat.root d7",
    "Eb7": "E flat.root d7",
    "F#m7b5": "F sharp.root m d7 flat.alt d5.sup",
    "Dm7/A": "D m d7 slash A",
    "C7alt": "C d7 a.sup l.sup t.sup",
    "F#o7": "F sharp.root dim.ring d7",
    "C6/9": "C d6 slash d9",
    "Cdim7": "C dim.ring d7",
    "Csus4": "C s u s d4",
    "Cadd9": "C a d.lc d.lc d9",
    "C13b9": "C d1 d3 flat.alt d9.sup",
}


@pytest.mark.parametrize("inp,expected", CASES.items(), ids=list(CASES.keys()))
def test_shape(inp, expected):
    assert shape(inp) == expected
