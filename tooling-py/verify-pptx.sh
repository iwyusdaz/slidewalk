#!/bin/sh
# Round-trip verification for a slidewalk PPTX. Uses the repo's own venv.
# Usage: tooling-py/verify-pptx.sh <deck.pptx> <deck.json>
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
if [ ! -x "$DIR/.venv/bin/python" ]; then
  echo "pptx-verify: python venv missing — creating tooling-py/.venv (one-time setup)..." >&2
  python3 -m venv "$DIR/.venv"
  "$DIR/.venv/bin/pip" install --quiet python-pptx==1.0.2
fi
exec "$DIR/.venv/bin/python" "$DIR/verify-pptx.py" "$@"
