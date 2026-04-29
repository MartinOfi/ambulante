# Reglas de portabilidad — backend

> Aplican a toda tarea que toque `@supabase/*` o el patrón Repository/Facade.

Este epic se diseñó para **no encadenar el código a Supabase** más de lo estrictamente necesario. Las siguientes reglas son **invariantes transversales** y aplican a todas las tareas.

### Directorios donde `@supabase/*` está permitido

Solo estos tres lugares pueden importar del SDK:

1. **`shared/repositories/supabase/*.ts`** — implementaciones Supabase de las interfaces de F3.4 (`OrdersRepository`, `StoresRepository`, `ProductsRepository`, `UsersRepository`, `AuditLogRepository`, etc.).
2. **`shared/services/*.supabase.ts`** — implementaciones Supabase de los facades (`auth.supabase.ts`, `storage.supabase.ts`, `realtime.supabase.ts`, `push.supabase.ts`).
3. **`app/api/cron/**/route.ts`** — Route Handlers de jobs del sistema que corren SQL directo por performance (con SKIP LOCKED).

### Facades obligatorios

Todo feature / componente / hook que necesite backend lo consume a través de uno de estos cuatro facades. Nunca del SDK.

| Facade | Firma pública | Implementaciones |
|---|---|---|
| `AuthService` | `signIn`, `signInWithMagicLink`, `signInWithGoogle`, `signOut`, `getSession`, `getUser`, `onAuthStateChange` | mock (hoy) → `auth.supabase.ts` (B4) |
| `StorageService` | `upload(bucket, path, file)`, `getPublicUrl(bucket, path)`, `getSignedUrl(bucket, path, expiresIn)`, `remove(bucket, paths)` | mock → `storage.supabase.ts` (B5) |
| `RealtimeService` | `subscribe(channel, config, handler)`, `unsubscribe(channel)`, `broadcast(channel, event, payload)` | mock → `realtime.supabase.ts` (B6) |
| `PushService` | `requestPermission()`, `subscribeUser(userId, endpoint)`, `unsubscribeUser(userId)`, `sendToUser(userId, payload)` | mock → `push.supabase.ts` (B8) |

### Regla de CI

Un test (B3.4) falla el CI si encuentra `from "@supabase` en cualquier archivo que no esté en los 3 directorios permitidos. Esto convierte la disciplina en estructural.

### Migration playbook — ¿qué cuesta salir de Supabase?

Esta tabla se mantiene al día por cada PR que toque backend. Si el costo crece silenciosamente, es señal de que se rompió la disciplina.

| Capa | Lock-in actual | Si migramos a X | Costo estimado |
|---|---|---|---|
| Postgres schema + índices + PostGIS | Cero (SQL estándar) | Cualquier Postgres (RDS, Neon, self-hosted) | **Gratis** — las migraciones corren tal cual |
| Lógica de dominio (state machine, snapshots, events) | Cero (vive en `shared/domain/`) | Cualquier backend | **Gratis** |
| React Query hooks + componentes | Cero (consumen facades) | Cualquier backend | **Gratis** |
| Repositories Supabase | Alto pero concentrado | Reimplementar `shared/repositories/<nuevo>/` | **~5 archivos, 2-3 días** |
| Facade Auth | Alto (flows de OAuth, cookies, session) | Auth.js / Clerk / custom | **~5 días** — incluye migrar datos de users |
| Facade Realtime | Alto (sintaxis de channels) | Ably / Pusher / SSE custom | **~3 días** |
| Facade Storage | Bajo (signed URLs estándar) | S3 / R2 / GCS | **~1 día** |
| Facade Push | Medio (solo el trigger cambia) | Webhook externo → webpush lib sigue igual | **~1 día** |
| RLS policies | Alto (sintaxis `auth.uid()` propia) | JWT custom + security definer functions | **~3 días** |
| pg_cron jobs | Bajo (extensión estándar) | Cualquier Postgres con pg_cron, o mover a Vercel Cron | **~1 día** |
| **TOTAL rewrite** | | | **~3 semanas** |

---
