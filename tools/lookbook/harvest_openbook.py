#!/usr/bin/env python3
"""Harvest chord-symbol crops from openbook.pdf using pdftotext -bbox word boxes."""
import re, subprocess, sys, os
from PIL import Image

PDF = os.environ.get("OPENBOOK_PDF", "openbook/docs/output/openbook.pdf")
DPI = 300
SCALE = DPI / 72.0
ROOT_RE = re.compile(r'^[A-G](m|maj|dim|aug|sus)?\d{0,2}$')

def words_for_page(page):
    out = f"/tmp/bbox_{page}.html"
    subprocess.run(["pdftotext","-bbox","-f",str(page),"-l",str(page),PDF,out],check=True)
    ws=[]
    for m in re.finditer(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', open(out).read()):
        x0,y0,x1,y1 = map(float,m.groups()[:4]); t=m.group(5)
        ws.append((x0,y0,x1,y1,t))
    return ws

def raster(page):
    png=f"/tmp/page_{page}.png"
    if not os.path.exists(png):
        subprocess.run(["pdftoppm","-png","-r",str(DPI),"-f",str(page),"-l",str(page),PDF,f"/tmp/page_{page}"],check=True)
        # pdftoppm names it page_N-NN.png
        import glob; src=glob.glob(f"/tmp/page_{page}-*.png")[0]; os.rename(src,png)
    return Image.open(png)

def harvest(page, outdir):
    ws = words_for_page(page)
    img = raster(page)
    cands=[]
    for x0,y0,x1,y1,t in ws:
        h = y1-y0
        if ROOT_RE.match(t) and 10.2 <= h <= 13.5:
            cands.append((x0,y0,x1,y1,t))
    # dedupe by proximity (same symbol may have several tokens; keep leftmost root)
    cands.sort(key=lambda c:(round(c[1]/5),c[0]))
    kept=[]
    for c in cands:
        if any(abs(c[0]-k[0])<30 and abs(c[1]-k[1])<8 for k in kept): continue
        kept.append(c)
    n=0
    for x0,y0,x1,y1,t in kept:
        # generous window to catch accidentals/superscripts around root
        cx0,cy0 = max(0,(x0-6)*SCALE), max(0,(y0-7)*SCALE)
        cx1,cy1 = min(img.width,(x0+62)*SCALE), min(img.height,(y1+5)*SCALE)
        crop = img.crop((int(cx0),int(cy0),int(cx1),int(cy1)))
        n+=1
        crop.save(f"{outdir}/p{page:03d}_{n:02d}_{t}.png")
    print(f"page {page}: {n} crops")

if __name__=="__main__":
    outdir=sys.argv[-1]; os.makedirs(outdir,exist_ok=True)
    for p in map(int,sys.argv[1:-1]): harvest(p,outdir)
