import uharfbuzz as hb
import pytest
from fontTools.ttLib import TTFont
from pathlib import Path

def load_font(font_path):
    """Load font and return (order, font) for shaping."""
    order = TTFont(font_path).getGlyphOrder()
    data = open(font_path, "rb").read()
    font = hb.Font(hb.Face(data))
    return order, font


def shape(s, font_obj, glyph_order):
    """Shape string with given font and return glyph names."""
    b = hb.Buffer()
    b.add_str(s)
    b.guess_segment_properties()
    hb.shape(font_obj, b, {"liga": True, "calt": True})
    return " ".join(glyph_order[i.codepoint] for i in b.glyph_infos)


# Real Book style test cases (jazz lead sheet conventions)
REALBOOK_CASES = {
    "Cmaj7": "C maj.tri d7",
    "Cmaj7#11": "C maj.tri d7 sharp.alt d1.sup d1.sup",
    "Dm7b5": "D m d7 flat.alt d5.sup",
    "F#m7": "F sharp.root m d7",
    "G13": "G d1 d3",
    "Bb": "B flat.root",
    "Bm7b5": "B m d7 flat.alt d5.sup",
    "Em7b5": "E m d7 flat.alt d5.sup",
    "Bø7": "B hdim.slash d7",
    "Fø": "F hdim.slash",
    "Fmaj7": "F maj.tri d7",
    "Bb7": "B flat.root d7",
    "Bbmaj7": "B flat.root maj.tri d7",
    "Eb7": "E flat.root d7",
    "Eb7b5": "E flat.root d7 flat.alt d5.sup",
    "F#m7b5": "F sharp.root m d7 flat.alt d5.sup",
    "Dm7/A": "D m d7 slash A",
    "C7alt": "C d7 a.sup l.sup t.sup",
    "E7b5": "E d7 flat.alt d5.sup",
    "E7#5": "E d7 sharp.alt d5.sup",
    "F#o7": "F sharp.root dim.ring d7",
    "C6/9": "C d6 slash d9",
    "Cdim7": "C dim.ring d7",
    "Csus4": "C s u s d4",
    "Cadd9": "C a d.lc d.lc d9",
    "C13b9": "C d1 d3 flat.alt d9.sup",
    # Linear parenthesized tensions (1D) — vertical stacks remain WALL
    "G7(b9)": "G d7 parenleft flat.alt d9.sup parenright",
    "C7(#11)": "C d7 parenleft sharp.alt d1.sup d1.sup parenright",
    "Bm7(b5)": "B m d7 parenleft flat.alt d5.sup parenright",
    "%": "repeat.bar",
}

# Pop style test cases (all extensions superscripted, M for major)
POP_CASES = {
    "CM7": "C M d7.sup",
    "Dm7": "D m d7.sup",
    "Dm7b5": "D m d7.sup flat.alt d5.sup",
    "F#m7": "F sharp.root m d7.sup",
    "G13": "G d1.sup d3.sup",
    "Bb": "B flat.root",
    "Bb7": "B flat.root d7.sup",
    "FM7": "F M d7.sup",
    "Em7": "E m d7.sup",
    "A7": "A d7.sup",
    "C7": "C d7.sup",
    "AM7": "A M d7.sup",
    "Bm6": "B m d6.sup",
    "Cdim": "C dim.ring",
    "Cdim7": "C dim.ring d7.sup",
    "Bø7": "B hdim.slash d7.sup",
    "G7(b9)": "G d7.sup parenleft flat.alt d9.sup parenright",
    "C7(#11)": "C d7.sup parenleft sharp.alt d1.sup d1.sup parenright",
    "%": "repeat.bar",
}


@pytest.mark.parametrize("inp,expected", REALBOOK_CASES.items(), ids=list(REALBOOK_CASES.keys()))
def test_realbook_shape(inp, expected):
    """Test Real Book style font shaping."""
    font_path = Path("dist/ChordFont-Real Book.ttf")
    if not font_path.exists():
        pytest.skip(f"Font not built: {font_path}")
    
    order, font_obj = load_font(font_path)
    assert shape(inp, font_obj, order) == expected


@pytest.mark.parametrize("inp,expected", POP_CASES.items(), ids=list(POP_CASES.keys()))
def test_pop_shape(inp, expected):
    """Test Pop style font shaping."""
    font_path = Path("dist/ChordFont-Pop.ttf")
    if not font_path.exists():
        pytest.skip(f"Font not built: {font_path}")
    
    order, font_obj = load_font(font_path)
    assert shape(inp, font_obj, order) == expected
