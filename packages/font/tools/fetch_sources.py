#!/usr/bin/env python3
"""Download pinned Petaluma source fonts and OFL license into sources/petaluma/."""

from __future__ import annotations

import sys
import urllib.request
from pathlib import Path

REPO = "steinbergmedia/petaluma"
PINNED_COMMIT = "532dcc7c9ae9b9d1e92cedf4f1d326cf2509f7d1"
PINNED_TAG = "petaluma-1.065"
RAW = f"https://raw.githubusercontent.com/{REPO}/{PINNED_COMMIT}"

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "sources" / "petaluma"
PINNED_REF = ROOT / "sources" / "PINNED_REF.txt"
SMUFL_GLYPHNAMES = ROOT / "sources" / "smufl" / "glyphnames.json"

ASSETS = {
    "Petaluma.otf": f"{RAW}/redist/otf/Petaluma.otf",
    "PetalumaScript.otf": f"{RAW}/redist/otf/PetalumaScript.otf",
    "OFL.txt": f"{RAW}/redist/OFL.txt",
}
SMUFL_URL = "https://raw.githubusercontent.com/w3c/smufl/gh-pages/metadata/glyphnames.json"


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"  {dest.name} <- {url}")
    urllib.request.urlretrieve(url, dest)


def main() -> int:
    print(f"Petaluma sources pinned to {PINNED_TAG} ({PINNED_COMMIT})")
    for name, url in ASSETS.items():
        download(url, OUT / name)

    download(SMUFL_URL, SMUFL_GLYPHNAMES)

    PINNED_REF.write_text(f"{PINNED_COMMIT}\n{PINNED_TAG}\n", encoding="utf-8")
    print(f"Wrote {PINNED_REF.relative_to(ROOT)}")
    print(f"Sources in {OUT.relative_to(ROOT)}/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
