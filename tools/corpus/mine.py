"""Corpus frequency miner — STUB (do not import from packages/).

Future loop:
  1. Load McGill Billboard Harte .lab annotations (CC0) and the Weimar Jazz
     Database SQLite chord table (ODbL).
  2. Frequency-rank all unique raw chord symbols.
  3. Run each through @chordlang/chord normalize() (via the CLI).
  4. Bucket: normalized-clean / normalized-lossy / failed.
  5. Emit a frequency-weighted report: the failures ARE the work queue,
     and McGill's Harte labels double as a round-trip oracle.
"""
raise SystemExit("stub — see docstring")
