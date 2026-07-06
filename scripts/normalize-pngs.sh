#!/usr/bin/env bash
# Normalize PNG files for reproducible builds
# Strips metadata and uses deterministic compression

set -euo pipefail

TARGET_DIR="${1:-docs/assets}"

echo "Normalizing PNGs in $TARGET_DIR for reproducibility..."

# Find all PNG files and normalize them
find "$TARGET_DIR" -type f -name "*.png" -print0 | while IFS= read -r -d '' png; do
  echo "  $(basename "$png")"
  # -strip: remove all metadata (timestamps, comments, etc.)
  # -o2: optimization level 2 (deterministic)
  optipng -strip all -o2 -quiet "$png"
done

echo "✓ PNGs normalized"
