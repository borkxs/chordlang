#!/usr/bin/env python3
"""Merge harvested/ + rendered/ corpora into unified entries.json + sources.json + refs/.

Run once after unpacking agent deliverables, or when refreshing either corpus:

    python3 tools/lookbook/merge_corpora.py
"""
from __future__ import annotations

import json
import re
import shutil
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SHAPEABLE = re.compile(r"^[A-G][#b]?[A-Za-z0-9#b+/]*$")
PRI = {"P0": 0, "P1": 1, "P2": 2}


def shape_ascii(canon: str | None) -> str | None:
    if canon and SHAPEABLE.match(canon):
        return canon
    return None


def method_for_harvested(e: dict) -> str:
    i = e["id"]
    if i.startswith("ob-"):
        return "crop"
    if i.startswith("ps-") or i.startswith("pm-"):
        return "glyph-specimen"
    return "external"


def method_for_rendered(e: dict) -> str:
    kind = (e.get("reference") or {}).get("kind", "")
    if kind == "in-context-crop":
        return "crop"
    if kind.startswith("external") or e["id"].startswith("ext-"):
        return "external"
    return "tool-engraving"


def norm_ref_file(ref: dict) -> dict:
    out = dict(ref)
    f = out.get("file")
    if f:
        name = Path(f).name
        out["file"] = f"refs/{name}"
    return out


def norm_harvested(e: dict) -> dict:
    out = {
        "id": e["id"],
        "method": method_for_harvested(e),
        "family": e["family"],
        "canonical_ascii": e["canonical_ascii"],
        "shape_ascii": shape_ascii(e["canonical_ascii"]),
        "as_printed": e.get("as_printed", ""),
        "display_note": e.get("display_note", ""),
        "label_status": e.get("label_status", "verified"),
        "house_style": e.get("house_style", ""),
        "observe": e.get("observe", []),
        "priority": e.get("priority", "P1"),
        "reference": norm_ref_file(e["reference"]),
    }
    if e.get("font_scope"):
        out["font_scope"] = e["font_scope"]
    return out


def norm_rendered(e: dict) -> dict:
    ref = norm_ref_file(e["reference"])
    house = e.get("house_style") or ref.get("source_title", "")
    return {
        "id": e["id"],
        "method": method_for_rendered(e),
        "family": e["family"],
        "canonical_ascii": e["canonical_ascii"],
        "shape_ascii": shape_ascii(e["canonical_ascii"]),
        "as_printed": e.get("as_printed")
        or e.get("as_printed_spelling")
        or e.get("canonical_ascii")
        or "",
        "display_note": e.get("display_note", ""),
        "label_status": e.get("label_status", "verified"),
        "house_style": house,
        "observe": e.get("observe", []),
        "priority": e.get("priority", "P1"),
        "reference": ref,
    }


def copy_refs(src_dir: Path, dest: Path) -> int:
    n = 0
    if not src_dir.is_dir():
        return 0
    dest.mkdir(parents=True, exist_ok=True)
    for p in src_dir.iterdir():
        if p.is_file():
            shutil.copy2(p, dest / p.name)
            n += 1
    return n


def main() -> None:
    harvested_dir = ROOT / "harvested"
    rendered_dir = ROOT / "rendered"
    if not harvested_dir.is_dir() and not rendered_dir.is_dir():
        raise SystemExit(
            "No harvested/ or rendered/ corpora found. "
            "Unpack agent zips into those dirs, then re-run."
        )

    entries: list[dict] = []
    if (harvested_dir / "entries.json").is_file():
        h = json.loads((harvested_dir / "entries.json").read_text())
        entries.extend(norm_harvested(e) for e in h["entries"])
        copy_refs(harvested_dir / "refs", ROOT / "refs")

    if (rendered_dir / "entries.json").is_file():
        r_raw = json.loads((rendered_dir / "entries.json").read_text())
        rendered = (
            r_raw["entries"]
            if isinstance(r_raw, dict) and "entries" in r_raw
            else r_raw
        )
        entries.extend(norm_rendered(e) for e in rendered)
        copy_refs(rendered_dir / "refs", ROOT / "refs")

    entries.sort(key=lambda e: (PRI.get(e["priority"], 9), e["family"], e["id"]))

    sources: list[dict] = []
    wanted_next: list = []
    if (harvested_dir / "sources.json").is_file():
        hs = json.loads((harvested_dir / "sources.json").read_text())
        sources.extend(hs.get("sources", []))
        wanted_next = hs.get("wanted_next", [])
    if (rendered_dir / "sources.json").is_file():
        rs = json.loads((rendered_dir / "sources.json").read_text())
        for key, meta in rs.items():
            sources.append(
                {
                    "key": key,
                    "title": meta.get("title", key),
                    "url": meta.get("url", ""),
                    "publisher_or_author": meta.get("author", ""),
                    "license_or_use_basis": meta.get("license_or_use_basis", ""),
                    "kind": meta.get("kind", "tool-engraving"),
                    "notes": meta.get("notes", ""),
                }
            )

    (ROOT / "entries.json").write_text(
        json.dumps(
            {"generated": date.today().isoformat(), "count": len(entries), "entries": entries},
            indent=2,
            ensure_ascii=False,
        )
        + "\n"
    )
    (ROOT / "sources.json").write_text(
        json.dumps({"sources": sources, "wanted_next": wanted_next}, indent=2, ensure_ascii=False)
        + "\n"
    )

    shapeable = sum(1 for e in entries if e["shape_ascii"])
    print(f"Wrote entries.json ({len(entries)} entries, {shapeable} shapeable)")
    print(f"Wrote sources.json ({len(sources)} sources)")
    print(f"refs/: {(ROOT / 'refs').is_dir() and len(list((ROOT / 'refs').iterdir()))} files")


if __name__ == "__main__":
    main()
