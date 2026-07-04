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
}


@pytest.mark.parametrize("inp,expected", CASES.items(), ids=list(CASES.keys()))
def test_shape(inp, expected):
    assert shape(inp) == expected
