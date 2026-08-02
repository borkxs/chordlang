#!/usr/bin/env python3
"""Regenerate ps-* / pm-* specimen refs from the Petaluma OTFs.
Usage: python3 render_specimens.py /path/to/petaluma/redist/otf
(clone https://github.com/steinbergmedia/petaluma)"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
OTF=sys.argv[1] if len(sys.argv)>1 else "petaluma/redist/otf"
def render(text, font_path, out, size=110, pad=22):
    font=ImageFont.truetype(font_path,size)
    d=ImageDraw.Draw(Image.new('L',(10,10)))
    b=d.textbbox((0,0),text,font=font)
    img=Image.new('RGB',(b[2]-b[0]+2*pad,b[3]-b[1]+2*pad),'white')
    ImageDraw.Draw(img).text((pad-b[0],pad-b[1]),text,font=font,fill='black')
    img.save(out)
S=f"{OTF}/PetalumaScript.otf"; M=f"{OTF}/Petaluma.otf"
SPECS=[("ps-bb-root","B\u266d"),("ps-fs-root","F\u266f"),("ps-eb-root","E\u266d"),("ps-cmaj7","Cmaj7"),
 ("ps-g7","G7"),("ps-c9","C9"),("ps-f13","F13"),("ps-dm7","Dm7"),("ps-halfdim","\u00f87"),
 ("ps-m7b5","Cm7\u266d5"),("ps-7b9","G7\u266d9"),("ps-7s9","E7\u266f9"),("ps-7s11","F7\u266f11"),
 ("ps-7alt","G7alt"),("ps-9sus4","C9sus4"),("ps-slash","Cmaj7/E"),("ps-69","C6/9"),("ps-13b9","G13\u266d9")]
GLYPHS=[("pm-csym-dim",0xE870),("pm-csym-halfdim",0xE871),("pm-csym-aug",0xE872),
        ("pm-csym-maj7-triangle",0xE873),("pm-csym-minor",0xE874)]
os.makedirs("refs",exist_ok=True)
for cid,t in SPECS: render(t,S,f"refs/{cid}.png")
for cid,cp in GLYPHS: render(chr(cp),M,f"refs/{cid}.png",size=140)
print("done")
