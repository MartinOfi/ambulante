# Supabase — Desarrollo local

Guía del ciclo de trabajo con Supabase CLI en local. Aplica a todo desarrollador y a los agentes del epic backend.

---

## Requisitos previos

- **Docker Desktop** corriendo antes de cualquier comando Supabase.
- `pnpm install` ejecutado (instala el CLI como devDependency).

---

## Comandos disponibles

| Script | Equivalente CLI | Cuándo usarlo |
|---|---|---|
| `pnpm supabase:start` | `supabase start` | Al comienzo de la sesión de trabajo. Levanta Postgres, Auth, Realtime, Storage y el pooler PgBouncer en Docker. **Idempotente** — si ya está corriendo, no hace nada. |
| `pnpm supabase:stop` | `supabase stop` | Al terminar la sesión. Detiene los contenedores pero **conserva los datos** del volumen Docker. |
| `pnpm supabase:reset` | `supabase db reset` | Destruye todos los datos locales, re-aplica todas las migraciones desde cero y corre `seed.sql`. Usar en CI y cuando necesitás estado limpio. **Destructivo.** |
| `pnpm supabase:status` | `supabase status` | Ver URLs, puertos y claves del entorno local activo. |
| `pnpm supabase:db:diff` | `supabase db diff` | Genera una migración nueva a partir de los cambios aplicados manualmente en la DB local. |
| `pnpm supabase:db:push` | `supabase db push` | Aplica las migraciones pendientes al entorno remoto (producción). Usar con cuidado. |
| `pnpm supabase:test` | `supabase test db` | Corre los tests pgTAP de `supabase/tests/`. |
| `pnpm supabase:test:rls` | `supabase test db --db-url $DATABASE_URL_DIRECT` | Corre tests de RLS policies con la URL directa (no pooler). |

---

## Ciclo de desarrollo estándar

```
pnpm supabase:start          # 1. Levantar la instancia local
# ... trabajar, agregar SQL en Studio o psql ...
pnpm supabase:db:diff        # 2. Capturar cambios como migración
# ... revisar el .sql generado en supabase/migrations/ ...
pnpm supabase:reset          # 3. Verificar que la migración aplica limpia desde cero
pnpm supabase:test           # 4. Correr tests pgTAP
# ... commit con la migración ...
pnpm supabase:stop           # 5. Detener al terminar
```

---

## URLs locales (después de `supabase:start`)

Ejecutar `pnpm supabase:status` para ver los valores exactos. Los defaults son:

| Recurso | URL / Puerto |
|---|---|
| API REST (PostgREST) | `http://localhost:54321` |
| Postgres directo | `postgresql://postgres:postgres@localhost:54322/postgres` |
| Pooler PgBouncer (transaction mode) | `postgresql://postgres:postgres@localhost:54329/postgres` |
| Supabase Studio (UI) | `http://localhost:54323` |
| Inbucket (email testing) | `http://localhost:54324` |

### Cuál URL usar para qué

| Contexto | URL local | Por qué |
|---|---|---|
| App Next.js en runtime | `postgresql://postgres:postgres@localhost:54329/postgres` (pooler) | Transaction mode reutiliza conexiones — esencial bajo carga |
| Migraciones (`supabase db push/reset`) | `postgresql://postgres:postgres@localhost:54322/postgres` (directo) | El pooler no soporta prepared statements en transaction mode |
| Tests pgTAP (`supabase:test` y `supabase:test:rls`) | `postgresql://postgres:postgres@localhost:54322/postgres` (directo) | Misma razón — pgTAP usa estado de sesión |

> En producción, estas URLs se leen de variables de entorno tipadas con Zod (`DATABASE_URL_POOLER` y `DATABASE_URL_DIRECT`). Esas variables se definen en `shared/config/env.schema.ts` — creado en la tarea **B0.2** (todavía no existe, no buscar el archivo).

---

## Worktrees paralelos

Si corrés múltiples worktrees simultáneamente (trabajo paralelo del epic backend), **cada worktree necesita su propio `project_id`** en `supabase/config.toml` para evitar colisiones de contenedores Docker. El proyecto principal usa `project_id = "ambulante"`.

Los worktrees de cadenas que no necesiten DB propia (ej: B0.2, B0.3) pueden compartir la instancia del principal o no levantarla en absoluto.

---

## Agregar una migración nueva

1. Crear el archivo en `supabase/migrations/` con el formato: `YYYYMMDDhhmmss_descripcion_en_snake_case.sql`
2. Seguir el template de idempotencia en `supabase/migrations/_template.sql` — creado en la tarea **B0.3** (todavía no existe; hasta que se complete B0.3, aplicar manualmente el patrón `DO $$ BEGIN IF NOT EXISTS(...) THEN ... END $$;`).
3. Correr `pnpm supabase:reset` para verificar que aplica desde cero.
4. Commitear la migración junto con los cambios de código que la requieren.

**Nunca** editar una migración ya commiteada en main — crear una nueva.

---

## Troubleshooting

**`supabase start` falla:** Verificar que Docker Desktop esté corriendo y que los puertos 54320–54329 estén libres.

**Conflicto de puertos entre worktrees:** Cambiar el `project_id` en `supabase/config.toml` del worktree secundario; los puertos se asignan por project_id.

**`supabase db diff` genera diff vacío:** Los cambios deben haberse aplicado a la DB local (via Studio o psql) antes de correr diff.
