# Migrations — Guía de convenciones

Cómo escribir, nombrar, aplicar y revertir migraciones de Postgres en Ambulante. Lee también [`supabase-local.md`](./supabase-local.md) para el ciclo de comandos.

---

## Naming convention

```
supabase/migrations/YYYYMMDDhhmmss_description_in_snake_case.sql
```

- El timestamp es el orden de aplicación. Supabase CLI lo usa para decidir qué ya se aplicó.
- La descripción debe ser descriptiva y en `snake_case` (no camelCase, sin espacios, sin guiones).
- Generar el timestamp con: `date -u +%Y%m%d%H%M%S` (macOS/Linux).
- Alternativa: `pnpm supabase:db:diff --name descripcion` genera el archivo con timestamp correcto automáticamente.

**Ejemplos correctos:**
```
20260428120000_enable_extensions.sql
20260428130000_core_tables.sql
20260428140000_composite_indexes.sql
```

**Nunca:**
```
migration_01.sql         ← sin timestamp
20260428_add_users.sql   ← timestamp incompleto (falta horas/min/seg)
20260428120000-addUsers.sql  ← guiones, camelCase
```

---

## Idempotencia: por qué y cómo

Una migración es **idempotente** si puede correrse múltiples veces sin error. Esto es esencial porque:
- `pnpm supabase:reset` re-aplica **todas** las migraciones desde cero.
- Rollback parcial + replay requiere que las migraciones sobrevivan a una segunda ejecución.
- CI corre en entornos limpios donde todo se aplica de cero.

### Qué tiene soporte nativo de idempotencia

| DDL | Patrón seguro |
|---|---|
| `CREATE TABLE` | `CREATE TABLE IF NOT EXISTS public.foo (...)` |
| `ADD COLUMN` | `ALTER TABLE public.foo ADD COLUMN IF NOT EXISTS bar text` |
| `DROP COLUMN` | `ALTER TABLE public.foo DROP COLUMN IF EXISTS bar` |
| `DROP CONSTRAINT` | `ALTER TABLE public.foo DROP CONSTRAINT IF EXISTS foo_bar_key` |
| `CREATE INDEX` | `CREATE INDEX IF NOT EXISTS idx_foo_bar ON public.foo (bar)` |
| `DROP INDEX` | `DROP INDEX IF EXISTS idx_foo_bar` |
| `CREATE EXTENSION` | `CREATE EXTENSION IF NOT EXISTS postgis` |
| `ALTER TYPE ADD VALUE` | `ALTER TYPE public.foo_status ADD VALUE IF NOT EXISTS 'pending'` |
| `CREATE OR REPLACE FUNCTION` | idempotente por diseño |
| `DROP TABLE` | `DROP TABLE IF EXISTS public.foo` |

### ADD CONSTRAINT requiere DO block

Postgres **no** tiene `ADD CONSTRAINT IF NOT EXISTS`. Usar el patrón del template:

```sql
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname  = 'foo_bar_unique'
      and conrelid = 'public.foo'::regclass
  ) then
    alter table public.foo
      add constraint foo_bar_unique unique (bar);
  end if;
end $$;
```

El nombre del constraint (`conname`) debe ser exactamente el que usa Postgres al crearlo. Convención del proyecto: `{tabla}_{columna(s)}_{tipo}` (ej: `orders_store_id_fkey`, `products_sku_unique`).

### CREATE TYPE requiere EXCEPTION pattern

```sql
do $$
begin
  create type public.order_status as enum ('enviado', 'recibido', 'aceptado');
exception
  when duplicate_object then null;
end $$;
```

### CREATE TRIGGER requiere check en pg_trigger

```sql
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname  = 'trg_foo_updated_at'
      and tgrelid = 'public.foo'::regclass
  ) then
    create trigger trg_foo_updated_at
      before update on public.foo
      for each row execute procedure public.set_updated_at();
  end if;
end $$;
```

### CREATE POLICY requiere check en pg_policy

```sql
do $$
begin
  if not exists (
    select 1 from pg_policy
    where polname  = 'foo_select_own'
      and polrelid = 'public.foo'::regclass
  ) then
    create policy foo_select_own
      on public.foo for select
      using ((select auth.uid()) is not null);
  end if;
end $$;
```

> **Template completo:** ver `supabase/migrations/_template.sql` para todos los patrones con ejemplos copiables.

---

## FK con índice: regla obligatoria

Toda FK debe tener un índice explícito en la **misma migración** que la crea. El CI (B0.4) falla si encuentra una FK sin índice.

```sql
-- FK
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname  = 'orders_store_id_fkey'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_store_id_fkey
      foreign key (store_id) references public.stores (id)
      on delete restrict;
  end if;
end $$;

-- Índice de la FK — siempre en la misma migración
create index if not exists idx_orders_store_id on public.orders (store_id);
```

---

## Cómo crear una migración nueva

```bash
# Opción A: generar automáticamente desde cambios aplicados en Studio o psql
pnpm supabase:db:diff --name descripcion_en_snake_case
# → crea supabase/migrations/YYYYMMDDhhmmss_descripcion_en_snake_case.sql

# Opción B: crear el archivo manualmente
touch "supabase/migrations/$(date -u +%Y%m%d%H%M%S)_descripcion_en_snake_case.sql"
# Copiar el template y editar
```

Verificar que aplica limpia:

```bash
pnpm supabase:reset   # destruye y recrea desde cero
pnpm supabase:test    # corre pgTAP tests
```

---

## Cómo revertir (rollback)

Supabase CLI no tiene rollback automático. La estrategia correcta es **crear una nueva migración que deshaga el cambio**.

```bash
# Ejemplo: revertir una columna agregada por error
touch "supabase/migrations/$(date -u +%Y%m%d%H%M%S)_drop_column_foo_bar.sql"
```

```sql
-- YYYYMMDDhhmmss_drop_column_foo_bar.sql
alter table public.foo drop column if exists bar;
```

**Nunca editar una migración ya commiteada en `main`.** Supabase trackea las migraciones aplicadas por nombre de archivo — si el nombre existe en `schema_migrations`, no se vuelve a aplicar, aunque cambies el contenido. Editar una migración commiteada genera drift entre el schema real y el archivo.

### Rollback en dev local

En local, donde podés destruir el estado:

```bash
# Volver a un estado anterior: eliminar el archivo de la migración "mala" y reset
rm supabase/migrations/YYYYMMDDhhmmss_migracion_mala.sql
pnpm supabase:reset
```

Esto solo funciona en local. En prod, crear la migración inversa.

---

## Data migrations

Para migraciones que mueven o transforman datos (no solo schema):

1. **Envolver en una transacción explícita** cuando sea posible:

```sql
begin;

-- schema change
alter table public.orders add column if not exists v2_status text;

-- backfill
update public.orders
   set v2_status = status::text
 where v2_status is null;

-- add constraint solo después del backfill
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname  = 'orders_v2_status_notnull'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_v2_status_notnull check (v2_status is not null);
  end if;
end $$;

commit;
```

2. **Tablas grandes (>100k filas):** no usar `ALTER TABLE ... SET NOT NULL` directamente — bloquea la tabla. Usar el patrón de constraint `NOT VALID` + `VALIDATE CONSTRAINT` por separado.

3. **Sin I/O externo dentro de la transacción.** Si la migración necesita disparar emails, webhooks o llamadas HTTP, hacerlo post-commit vía domain events o un job separado.

---

## Convenciones de nombres SQL (invariantes del epic)

Estas reglas aplican a toda migración. El code review las verifica.

| Qué | Convención | Ejemplo |
|---|---|---|
| Tablas | `snake_case` lowercase | `order_items`, `store_locations` |
| Columnas | `snake_case` lowercase | `created_at`, `store_id` |
| Índices | `idx_{tabla}_{columnas}` | `idx_orders_store_id` |
| FKs | `{tabla}_{columna}_fkey` | `orders_store_id_fkey` |
| Unique constraints | `{tabla}_{columna(s)}_unique` | `products_sku_unique` |
| Check constraints | `{tabla}_{descripcion}` | `orders_status_valid` |
| Triggers | `trg_{tabla}_{evento}` | `trg_orders_updated_at` |
| Funciones | `snake_case` | `set_updated_at`, `handle_new_user` |
| Policies | `{tabla}_{accion}_{actor}` | `orders_select_own`, `stores_insert_authenticated` |
| Enums/tipos | `{dominio}_{concepto}` | `order_status`, `user_role` |

**Prohibido** mixedCase con comillas dobles. Postgres es case-insensitive sin comillas, pero sensible con ellas. Usar comillas rompe la portabilidad.

---

## Checklist antes de hacer commit con una migración

- [ ] Nombre del archivo sigue `YYYYMMDDhhmmss_snake_case.sql`
- [ ] Todos los DDL usan patrones idempotentes (ver tabla arriba)
- [ ] Toda FK nueva tiene su índice en la misma migración
- [ ] RLS habilitado en tablas nuevas antes de agregar policies
- [ ] Policies usan `(select auth.uid())`, no `auth.uid()` directo
- [ ] Sin I/O externo (fetch, email, HTTP) dentro de transacciones
- [ ] `pnpm supabase:reset` corrió sin errores
- [ ] `pnpm supabase:test` corrió sin errores
