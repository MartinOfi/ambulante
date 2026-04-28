# RLS Patterns — Required and Prohibited

Reference for writing Row-Level Security policies in Ambulante migrations.
Enforced automatically by `scripts/rls-lint.sh` in CI.

---

## Pattern 1 — Wrap `auth.uid()` in a subquery

### Why

Without the subquery, Postgres evaluates `auth.uid()` once **per row** scanned.
With `(select auth.uid())`, the result is computed once per query and cached.
On a table with 10 000 rows the difference is ~10 000 calls vs 1.

### Prohibited

```sql
-- BAD: auth.uid() called once per row
create policy "owner_select" on public.orders
  for select to authenticated
  using (auth.uid() = user_id);
```

### Required

```sql
-- GOOD: evaluated once per query
create policy "owner_select" on public.orders
  for select to authenticated
  using ((select auth.uid()) = user_id);
```

---

## Pattern 2 — Always declare an explicit `TO` role

### Why

Omitting `TO` defaults the policy to `PUBLIC`, which includes unauthenticated
(`anon`) users. This silently exposes data or operations you intended to
restrict to logged-in users.

### Prohibited

```sql
-- BAD: defaults to PUBLIC (includes anon)
create policy "owner_select" on public.orders
  for select
  using ((select auth.uid()) = user_id);
```

### Required

```sql
-- GOOD: explicit target role
create policy "owner_select" on public.orders
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- or, for truly public read:
create policy "public_read" on public.menus
  for select to anon
  using (true);
```

---

## Lint tool

`scripts/rls-lint.sh` runs these two checks statically (no DB connection
required). Usage:

```bash
# default: scans supabase/migrations/
bash scripts/rls-lint.sh

# custom directory
bash scripts/rls-lint.sh path/to/sql
```

Exits `0` when all checks pass, `1` otherwise. The CI job `rls-lint` runs it
on every push and PR.

---

## References

- Supabase docs: [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- Skill rule: `.claude/skills/supabase-postgres-best-practices/references/security-rls-performance.md`
