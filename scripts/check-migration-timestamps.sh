#!/usr/bin/env bash
# scripts/check-migration-timestamps.sh
#
# Guards against duplicate migration timestamps and malformed filenames.
# Supabase uses the 14-char prefix (YYYYMMDDhhmmss) as the PK in
# schema_migrations — a duplicate causes `supabase db reset` to fail with
# "duplicate key value violates unique constraint schema_migrations_pkey".
#
# Checks performed:
#   1. Every file matches the format  YYYYMMDDhhmmss_<description>.sql
#   2. No two files share the same 14-char timestamp prefix
#
# Exits 1 if any violation is found.
#
# Usage (run from repo root):
#   bash scripts/check-migration-timestamps.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

MIGRATIONS_DIR="supabase/migrations"
ERRORS=0

echo "Migration timestamp check"
echo ""

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "SKIP ($MIGRATIONS_DIR not found)"
  exit 0
fi

# Sorted list of .sql files, excluding _template.sql (newline-separated).
MIGRATION_LIST=$(find "$MIGRATIONS_DIR" -maxdepth 1 -name "*.sql" ! -name "_template.sql" | sort)
FILE_COUNT=$(printf '%s\n' "$MIGRATION_LIST" | grep -c . || true)

if [[ "$FILE_COUNT" -eq 0 ]]; then
  echo "No migration files found — nothing to check."
  exit 0
fi

# ─── check 1: format (YYYYMMDDhhmmss_<description>.sql) ──────────────────────

echo "==> [1/2] Format check (YYYYMMDDhhmmss_*.sql)"

FORMAT_ERRORS=0
while IFS= read -r filepath; do
  [[ -z "$filepath" ]] && continue
  filename="$(basename "$filepath")"
  if ! [[ "$filename" =~ ^[0-9]{14}_[a-z0-9_]+\.sql$ ]]; then
    echo "  FAIL: $filename — expected YYYYMMDDhhmmss_<description>.sql (lowercase, no spaces)"
    FORMAT_ERRORS=$((FORMAT_ERRORS + 1))
  fi
done <<< "$MIGRATION_LIST"

if [[ "$FORMAT_ERRORS" -eq 0 ]]; then
  echo "OK ($FILE_COUNT files)"
else
  ERRORS=$((ERRORS + FORMAT_ERRORS))
fi

echo ""

# ─── check 2: duplicate timestamp prefixes ────────────────────────────────────

echo "==> [2/2] Duplicate timestamps"

DUPLICATES=$(
  while IFS= read -r filepath; do
    [[ -z "$filepath" ]] && continue
    filename="$(basename "$filepath")"
    printf '%s\n' "${filename:0:14}"
  done <<< "$MIGRATION_LIST" \
  | sort | uniq -d
)

if [[ -n "$DUPLICATES" ]]; then
  echo "FAIL: duplicate timestamp(s) found:"
  while IFS= read -r ts; do
    [[ -z "$ts" ]] && continue
    echo ""
    echo "  Timestamp: $ts"
    while IFS= read -r filepath; do
      [[ -z "$filepath" ]] && continue
      filename="$(basename "$filepath")"
      [[ "${filename:0:14}" == "$ts" ]] && echo "    $filename"
    done <<< "$MIGRATION_LIST"
  done <<< "$DUPLICATES"
  ERRORS=$((ERRORS + 1))
else
  echo "OK"
fi

echo ""

# ─── summary ──────────────────────────────────────────────────────────────────

if [[ "$ERRORS" -gt 0 ]]; then
  echo "Migration timestamp check FAILED."
  echo ""
  echo "Fix: rename the conflicting file to the next free slot."
  echo "  Next available: ls supabase/migrations/ | sort | tail -2"
  exit 1
fi

echo "Migration timestamp check PASSED."
