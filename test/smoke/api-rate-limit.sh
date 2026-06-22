#!/usr/bin/env bash
# Smoke test for API rate limiting
# Usage: ./test/smoke/api-rate-limit.sh [base_url]
# Requires: curl, jq
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

echo "🔍 Smoke testing rate limiting against $BASE_URL"
echo

echo "═══ Rate limit headers present ═══"
RESP=$(curl -s -i "$BASE_URL/api/images?limit=1" | head -20)
echo "$RESP" | grep -i "ratelimit-limit" > /dev/null && echo "  ✅ ratelimit-limit header present" && ((PASS++)) || { echo "  ❌ ratelimit-limit header missing"; ((FAIL++)); }
echo "$RESP" | grep -i "ratelimit-remaining" > /dev/null && echo "  ✅ ratelimit-remaining header present" && ((PASS++)) || { echo "  ❌ ratelimit-remaining header missing"; ((FAIL++)); }
echo "$RESP" | grep -i "ratelimit-reset" > /dev/null && echo "  ✅ ratelimit-reset header present" && ((PASS++)) || { echo "  ❌ ratelimit-reset header missing"; ((FAIL++)); }

echo
echo "═══ Public endpoint returns 200 ␛"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/images?limit=1")
if [ "$STATUS" = "200" ]; then
  echo "  ✅ HTTP 200"
  ((PASS++))
else
  echo "  ❌ Expected 200, got $STATUS"
  ((FAIL++))
fi

echo
echo "═══════════════════════════════"
echo "Results: $PASS passed, $FAIL failed"
echo "═══════════════════════════════"
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
