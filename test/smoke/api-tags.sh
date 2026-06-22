#!/usr/bin/env bash
# Smoke test for GET /api/tags
# Usage: ./test/smoke/api-tags.sh [base_url]
# Requires: curl, jq
# Run against a running dev server: bun run dev (in another terminal)
# Default port: $PORT or 3001 — set PORT=3000 to override

PORT="${PORT:-3001}"
BASE_URL="${1:-http://localhost:$PORT}"
PASS=0
FAIL=0

assert() {
  local description="$1"
  local expected="$2"
  local actual="$3"

  if echo "$actual" | jq --exit-status "$expected" > /dev/null 2>&1; then
    echo "  ✅ $description"
    ((PASS++))
  else
    echo "  ❌ $description"
    echo "     Expected: jq '$expected'"
    echo "     Got: $actual"
    ((FAIL++))
  fi
}

echo "🔍 Smoke testing GET /api/tags against $BASE_URL"
echo

echo "═══ Default: no params ═══"
RESP=$(curl -s "$BASE_URL/api/tags")
assert "returns success" '.success == true' "$RESP"
assert "has data array" '.data | type == "array"' "$RESP"
assert "has pagination" '.pagination | has("total") and has("hasMore")' "$RESP"

echo
echo "═══ Search: ?query=landscape ═══"
SEARCH=$(curl -s "$BASE_URL/api/tags?query=landscape")
assert "returns success" '.success == true' "$SEARCH"

echo
echo "═══ Pagination: ?limit=2 ═══"
PAGED=$(curl -s "$BASE_URL/api/tags?limit=2")
assert "at most 2 items" '.data | length <= 2' "$PAGED"

echo
echo "═══════════════════════════════"
echo "Results: $PASS passed, $FAIL failed"
echo "═══════════════════════════════"
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
