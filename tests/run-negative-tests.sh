#!/bin/sh
# Negative tests — prove the gates actually catch failures (a gate that cannot
# fail is decoration). Two layers:
#   1. BUILD REFUSAL: `slidewalk build` on an outline whose informative image
#      has no alt text must exit non-zero with an actionable fix list.
#   2. GATE CATCH: the gate runner on a hand-crafted broken deck (no lang, no
#      h1, skipped heading, no-alt image, contrast failure, dead keyboard)
#      must exit non-zero and name every seeded failure.
# The script itself exits 0 when the gates DO catch the failures.
set -u
cd "$(dirname "$0")/.."
echo "=== negative test 1: build must refuse an informative image without alt text ==="
if node skill/scripts/slidewalk.mjs build tests/fixtures/broken-outline.md --out /tmp/slidewalk-broken; then
  echo "NEGATIVE TEST 1 FAILED: build accepted a deck with a missing alt text"
  exit 1
else
  echo "-> build refused the broken outline (exit $?) — as required"
fi

echo ""
echo "=== negative test 2: gate runner must catch every seeded failure ==="
GATE_OUT="$(node tooling/run-gates.mjs tests/fixtures/broken-deck.html --out tests/fixtures/gate-results 2>&1)"
GATE_CODE=$?
echo "$GATE_OUT"
if [ $GATE_CODE -eq 0 ]; then
  echo "NEGATIVE TEST 2 FAILED: gates passed a deliberately broken deck"
  exit 1
fi
echo "-> gate runner exited $GATE_CODE on the broken deck — as required"

# every seeded failure must be named in the fix list
missing=0
for seed in "html-has-lang" "Exactly one <h1>" "skipped" "alt" "color-contrast" "keyboard"; do
  case "$GATE_OUT" in
    *"$seed"*) echo "-> caught: $seed" ;;
    *) echo "NEGATIVE TEST 2 INCOMPLETE: seeded failure '$seed' was not caught"; missing=1 ;;
  esac
done
[ $missing -eq 0 ] || exit 1
echo ""
echo "negative tests: PASS — both layers catch the seeded failures"
