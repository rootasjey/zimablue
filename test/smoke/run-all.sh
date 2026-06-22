#!/usr/bin/env bash
# Run all API smoke tests
# Usage: ./test/smoke/run-all.sh [base_url]
# Requires: curl, jq
# Default port: $PORT or 3001 — set PORT=3000 to override

PORT="${PORT:-3001}"
BASE_URL="${1:-http://localhost:$PORT}"
DIR="$(cd "$(dirname "$0")" && pwd)"
ALL_PASS=0
ALL_FAIL=0

for script in "$DIR"/api-*.sh; do
  name="$(basename "$script")"
  echo ""
  echo "═══════════════════════════════════════════"
  echo "  Running: $name"
  echo "═══════════════════════════════════════════"
  bash "$script" "$BASE_URL"
  ret=$?
  if [ "$ret" -eq 0 ]; then
    ((ALL_PASS++))
  else
    ((ALL_FAIL++))
  fi
done

echo ""
echo "═══════════════════════════════════════════"
echo "  All smoke tests: $ALL_PASS passed, $ALL_FAIL failed"
echo "═══════════════════════════════════════════"
[ "$ALL_FAIL" -gt 0 ] && exit 1 || exit 0
