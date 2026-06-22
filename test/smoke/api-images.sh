#!/usr/bin/env bash
# Smoke test for GET /api/images
# Usage: ./test/smoke/api-images.sh [base_url]
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

echo "🔍 Smoke testing GET /api/images against $BASE_URL"
echo

# ── Test 1: Legacy mode (no params) — returns raw array ──
echo "═══ Legacy mode: no pagination params ═══"
LEGACY=$(curl -s "$BASE_URL/api/images")
assert "returns an array" \
  'type == "array"' \
  "$LEGACY"

assert "first item has id, name, slug" \
  '.[0] | has("id") and has("name") and has("slug")' \
  "$LEGACY"

assert "first item has snake_case keys" \
  '.[0] | has("stats_views") and has("created_at")' \
  "$LEGACY"

echo

# ── Test 2: Paginated mode (?limit=5) ──
echo "═══ Paginated mode: ?limit=5 ═══"
PAGINATED=$(curl -s "$BASE_URL/api/images?limit=5")
assert "returns success object" \
  '.success == true' \
  "$PAGINATED"

assert "has data array with max 5 items" \
  '.data | length <= 5' \
  "$PAGINATED"

assert "each item has required fields" \
  '.data[0] | has("id") and has("name") and has("slug")' \
  "$PAGINATED"

assert "has pagination with total, limit, offset, hasMore" \
  '.pagination | has("total") and has("limit") and has("offset") and has("hasMore")' \
  "$PAGINATED"

assert "pagination limit matches request" \
  '.pagination.limit == 5' \
  "$PAGINATED"

echo

# ── Test 3: Fields filtering (?limit=2&fields=id,name,slug) ──
echo "═══ Fields filtering: ?limit=2&fields=id,name,slug ␛"
FIELDS=$(curl -s "$BASE_URL/api/images?limit=2&fields=id,name,slug")
assert "only returns requested fields" \
  '(.data[0] | length) == 3 and (.data[0] | has("id")) and (.data[0] | has("name")) and (.data[0] | has("slug"))' \
  "$FIELDS"
assert "excludes non-requested fields" \
  '.data[0] | has("variants") | not' \
  "$FIELDS"

echo

# ── Test 4: Pagination boundary (?limit=5&offset=100000) ──
echo "═══ Paginated mode: ?limit=5&offset=100000 (beyond total) ═══"
EMPTY=$(curl -s "$BASE_URL/api/images?limit=5&offset=100000")
assert "returns success" \
  '.success == true' \
  "$EMPTY"

assert "returns empty data array" \
  '.data | length == 0' \
  "$EMPTY"

assert "hasMore is false" \
  '.pagination.hasMore == false' \
  "$EMPTY"

echo

# ── Test 5: Second page (?limit=2&offset=2) ──
echo "═══ Paginated mode: ?limit=2&offset=2 (second page) ═══"
PAGE2=$(curl -s "$BASE_URL/api/images?limit=2&offset=2")
assert "returns success" \
  '.success == true' \
  "$PAGE2"

echo

# ── Summary ──
echo "═══════════════════════════════"
echo "Results: $PASS passed, $FAIL failed"
echo "═══════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
