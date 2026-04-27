-- Audit: FK columns without a covering index.
-- Returns (table_name, fk_column) for every unindexed FK.
-- If any row is returned, CI fails (schema-foreign-key-indexes rule — HIGH impact).
-- Run: psql "$DB_URL" --tuples-only --no-align -f scripts/db-audit-fk-indexes.sql
select
  conrelid::regclass as table_name,
  a.attname          as fk_column
from   pg_constraint c
join   pg_attribute   a
         on a.attrelid = c.conrelid
        and a.attnum   = any(c.conkey)
where  c.contype = 'f'
  and  array_length(c.conkey, 1) = 1  -- composite FKs need prefix-match logic; extend if ever added
  and  not exists (
         select 1
         from   pg_index i
         where  i.indrelid = c.conrelid
           and  a.attnum   = any(i.indkey)
       )
order  by table_name, fk_column;
