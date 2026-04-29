#!/usr/bin/env bash
# scripts/check-supabase-imports.sh
#
# Enforces the Supabase portability boundary (docs/epic-backend/portabilidad.md).
# @supabase/* imports are only allowed in three directories:
#   - shared/repositories/supabase/*.ts
#   - shared/services/*.supabase.ts
#   - app/api/cron/**/route.ts
#
# This is a second line of defence against eslint-disable bypasses (see B3.3).
# ESLint catches violations at dev time; this script blocks them in CI regardless.
#
# Exits 1 if any violation is found.
#
# Usage (run from repo root):
#   bash scripts/check-supabase-imports.sh

set -euo pipefail

ERRORS=0

echo "Supabase import boundary check"
echo ""

# Scan a directory for @supabase imports, skipping paths that match exclude_re.
# Prints matching lines in grep -Hn format (file:line:content).
scan_dir() {
  local dir="$1"
  local exclude_re="${2:-}"
  local found=""

  while IFS= read -r file; do
    [[ -n "$exclude_re" && "$file" =~ $exclude_re ]] && continue
    local result
    result=$(grep -Hn "@supabase" "$file" 2>/dev/null || true)
    [[ -n "$result" ]] && found="${found}${result}"$'\n'
  done < <(find "$dir" -type f \( -name "*.ts" -o -name "*.tsx" \) | sort)

  printf "%s" "$found"
}

# ─── check 1: features/ — no @supabase imports allowed anywhere ───────────────

echo "==> [1/2] features/ — @supabase not allowed"

if [[ -d features ]]; then
  FEAT=$(scan_dir "features")
  if [[ -n "$FEAT" ]]; then
    echo "FAIL:"
    printf "%s" "$FEAT"
    ERRORS=$((ERRORS + 1))
  else
    echo "OK"
  fi
else
  echo "SKIP (features/ not found)"
fi

echo ""

# ─── check 2: app/ — @supabase allowed only in app/api/cron/ ─────────────────

echo "==> [2/2] app/ (excluding app/api/cron/) — @supabase not allowed"

if [[ -d app ]]; then
  APP=$(scan_dir "app" "^app/api/cron/")
  if [[ -n "$APP" ]]; then
    echo "FAIL:"
    printf "%s" "$APP"
    ERRORS=$((ERRORS + 1))
  else
    echo "OK"
  fi
else
  echo "SKIP (app/ not found)"
fi

echo ""

# ─── summary ──────────────────────────────────────────────────────────────────

if [[ "$ERRORS" -gt 0 ]]; then
  echo "Boundary check FAILED — ${ERRORS} area(s) with violations."
  echo ""
  echo "Allowed @supabase/* locations:"
  echo "  shared/repositories/supabase/*.ts"
  echo "  shared/services/*.supabase.ts"
  echo "  app/api/cron/**/route.ts"
  echo ""
  echo "Fix: move imports to the appropriate repository or facade."
  exit 1
fi

echo "Boundary check PASSED."
