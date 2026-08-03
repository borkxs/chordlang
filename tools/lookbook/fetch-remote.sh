#!/usr/bin/env bash
# Localize hotlinked reference images so lookbook.html works fully offline.
set -euo pipefail
cd "$(dirname "$0")"
curl -sL -o refs/lp-chord-name-chart.png "https://lilypond.org/doc/v2.25/Documentation/17/lily-3ed4d53a.png"
echo "fetched: refs/lp-chord-name-chart.png"
