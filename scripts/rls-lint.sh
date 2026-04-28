#!/usr/bin/env bash
# scripts/rls-lint.sh
#
# Static analysis for prohibited RLS patterns in SQL migration files.
# Exits 1 if any violation is found.
#
# Usage (run from repo root):
#   scripts/rls-lint.sh [sql-dir]
#
# Defaults sql-dir to "supabase/migrations".
# Excludes _template.sql (examples, not real migrations).
#
# Known limitation (check 1): an auth.uid() call that is split across
# lines where the (select …) wrapper opens on a prior line will produce
# a false positive. This formatting is not used in practice.

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

# grep output format is "filename:linenum:content".
# The comment filter anchors to that prefix so only pure comment lines
# (content begins with --) are excluded; inline comments are kept.
BARE=$(grep -rEn --include="*.sql" --exclude="_template.sql" \
  "auth\.uid\(\)" -- "$SQL_DIR" \
  | grep -Ev "^[^:]+:[[:digit:]]+:[[:space:]]*--"  `# skip pure comment lines` \
  | grep -Ev "\(select auth\.uid\(\)\)"              `# exclude correct pattern` \
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
    # Accumulate a CREATE POLICY block; skip pure comment lines.
    /[Cc][Rr][Ee][Aa][Tt][Ee][[:space:]]+[Pp][Oo][Ll][Ii][Cc][Yy]/ &&
    !/^[[:space:]]*--/ {
      block = $0
      first_line = NR
      # Single-line policy: CREATE POLICY … ; on the same line.
      if (/;/) {
        # Trim to header (before USING / WITH CHECK) so string literals
        # in the body expression cannot produce false negatives.
        header = $0
        sub(/[[:space:]][Uu][Ss][Ii][Nn][Gg][[:space:]]*\(.*/, "", header)
        sub(/[Ww][Ii][Tt][Hh][[:space:]]+[Cc][Hh][Ee][Cc][Kk][[:space:]]*\(.*/, "", header)
        if (header !~ /[[:space:]][Tt][Oo][[:space:]]+(authenticated|anon)([[:space:]\n;(]|$)/) {
          print FILENAME ":" NR ": " $0
        }
        next
      }
      in_block = 1
      next
    }
    in_block {
      block = block "\n" $0
      if (/;/) {
        # Scan only the policy header (lines before USING / WITH CHECK) to
        # avoid matching the keyword inside body string literals.
        n = split(block, blines, "\n")
        header = ""
        for (i = 1; i <= n; i++) {
          if (tolower(blines[i]) ~ /[[:space:]]using[[:space:]]*\(/ || \
              tolower(blines[i]) ~ /with[[:space:]]+check[[:space:]]*\(/) break
          header = header blines[i] "\n"
        }
        if (header !~ /[[:space:]][Tt][Oo][[:space:]]+(authenticated|anon)([[:space:]\n;(]|$)/) {
          split(block, lines, "\n")
          print FILENAME ":" first_line ": " lines[1]
        }
        in_block = 0
        block = ""
      }
    }
  ' "$sql_file" || true)
  [[ -n "$RESULT" ]] && MISSING_TO="${MISSING_TO}${RESULT}"$'\n'
done < <(grep -rl --include="*.sql" --exclude="_template.sql" -i "create policy" -- "$SQL_DIR" 2>/dev/null || true)

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
