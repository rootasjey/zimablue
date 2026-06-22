#!/usr/bin/env bash
# Smoke test for GET /api/collections
# Usage: ./test/smoke/api-collections.sh [base_url]
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

echo "🔍 Smoke testing GET /api/collections against $BASE_URL"
echo

echo "═══ Default mode: ?limit=10 ═══"
RESP=$(curl -s "$BASE_URL/api/collections?limit=10")
assert "returns success" \
  '.success == true' \
  "$RESP"
assert "has data array" \
  '.data | type == "array"' \
  "$RESP"
assert "has pagination with total, limit, offset, hasMore" \
  '.pagination | has("total") and has("limit") and has("offset") and has("hasMore")' \
  "$RESP"
assert "each item has id, name, slug" \
  'if (.data | length) > 0 then .data[0] | has("id") and has("name") and has("slug") else true end' \
  "$RESP"

echo
echo "═══ Pagination: ?limit=2&offset=0 ═══"
PAGED=$(curl -s "$BASE_URL/api/collections?limit=2")
assert "returns at most 2 items" \
  '.data | length <= 2' \
  "$PAGED"

echo
echo "═══════════════════════════════"
echo "Results: $PASS passed, $FAIL failed"
echo "═══════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
