#!/usr/bin/env bash
# Smoke test for GET /api/search
# Usage: ./test/smoke/api-search.sh [base_url]
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

echo "🔍 Smoke testing GET /api/search against $BASE_URL"
echo

echo "═══ Empty query (no search term) ═══"
EMPTY=$(curl -s "$BASE_URL/api/search")
assert "returns success" '.success == true' "$EMPTY"
assert "has data.images" '.data.images | type == "array"' "$EMPTY"
assert "has data.collections" '.data.collections | type == "array"' "$EMPTY"
assert "has data.total" '.data.total | has("images") and has("collections")' "$EMPTY"

echo
echo "═══ With query: ?q=test ␛"
QUERY=$(curl -s "$BASE_URL/api/search?q=test")
assert "returns success" '.success == true' "$QUERY"

echo
echo "═══════════════════════════════"
echo "Results: $PASS passed, $FAIL failed"
echo "═══════════════════════════════"
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
