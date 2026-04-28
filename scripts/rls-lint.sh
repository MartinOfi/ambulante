#!/usr/bin/env bash
# scripts/rls-lint.sh
#
# Static analysis for prohibited RLS patterns in SQL migration files.
# Exits 1 if any violation is found.
#
# Usage:
#   scripts/rls-lint.sh [sql-dir]
#
# Defaults sql-dir to "supabase/migrations".
# Excludes _template.sql (examples, not real migrations).

set -euo pipefail

SQL_DIR="${1:-supabase/migrations}"
ERRORS=0

if [[ ! -d "$SQL_DIR" ]]; then
  echo "ERROR: directory not found: $SQL_DIR"
  exit 1
fi

echo "RLS lint — scanning: $SQL_DIR"
echo ""

# ─── check 1: bare auth.uid() not wrapped in (select ...) ────────────────────
#
# PROHIBITED:  using (auth.uid() = user_id)
# REQUIRED:    using ((select auth.uid()) = user_id)
#
# Rationale: without the subquery, Postgres calls auth.uid() once per row.
# With (select auth.uid()), it is called once per query and the result cached.

echo "==> [1/2] Bare auth.uid() — must use (select auth.uid())"

BARE=$(grep -rEn "auth\.uid\(\)" "$SQL_DIR" \
  --include="*.sql" \
  --exclude="_template.sql" \
  | grep -Ev "[[:space:]]*--"            `# skip comment lines` \
  | grep -Ev "\(select auth\.uid\(\)\)"  `# exclude correct pattern` \
  || true)

if [[ -n "$BARE" ]]; then
  echo "FAIL — replace with (select auth.uid()):"
  echo "$BARE"
  ERRORS=$((ERRORS + 1))
else
  echo "OK"
fi

echo ""

# ─── check 2: CREATE POLICY without explicit TO role ─────────────────────────
#
# Every policy must declare its target role explicitly.
# Omitting TO defaults to PUBLIC, which includes anonymous users — security risk.
#
# REQUIRED: to authenticated  |  to anon

echo "==> [2/2] CREATE POLICY without explicit TO authenticated/anon"

MISSING_TO=""
while IFS= read -r sql_file; do
  RESULT=$(awk '
    # start accumulating a policy block (skip comment lines)
    /[Cc][Rr][Ee][Aa][Tt][Ee][[:space:]]+[Pp][Oo][Ll][Ii][Cc][Yy]/ &&
    !/^[[:space:]]*--/ {
      block = $0
      first_line = NR
      in_block = 1
      next
    }
    in_block {
      block = block "\n" $0
      if (/;/) {
        if (block !~ /[[:space:]]to[[:space:]]+(authenticated|anon)/) {
          split(block, lines, "\n")
          print FILENAME ":" first_line ": " lines[1]
        }
        in_block = 0
        block = ""
      }
    }
  ' "$sql_file" || true)
  [[ -n "$RESULT" ]] && MISSING_TO="${MISSING_TO}${RESULT}"$'\n'
done < <(grep -rl --include="*.sql" --exclude="_template.sql" -i "create policy" "$SQL_DIR" 2>/dev/null || true)

if [[ -n "$MISSING_TO" ]]; then
  echo "FAIL — add 'to authenticated' or 'to anon' to each policy:"
  printf "%s" "$MISSING_TO"
  ERRORS=$((ERRORS + 1))
else
  echo "OK"
fi

# ─── summary ──────────────────────────────────────────────────────────────────

echo ""
if [[ "$ERRORS" -gt 0 ]]; then
  echo "RLS lint FAILED — ${ERRORS} check(s) failed."
  exit 1
fi
echo "RLS lint PASSED."
