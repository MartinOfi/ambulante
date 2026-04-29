# Runbook: Prod Setup — Ambulante (Supabase Cloud + Vercel)

> **Audiencia:** persona con permisos de Owner en la organización Supabase y rol Owner/Admin en el proyecto Vercel de Ambulante.
> **Última revisión:** 2026-04-29
> **Tarea de origen:** [`B14.1`](../epic-backend/tasks/B14.1.md) — crear proyecto Supabase Cloud + inyectar secrets.
> **Cross-refs:** [`secret-rotation.md`](./secret-rotation.md) (rotación post-go-live), [`portabilidad.md`](../epic-backend/portabilidad.md) (qué corre dónde), `shared/config/env.schema.ts` (fuente de verdad de las variables).

Este runbook se ejecuta **una sola vez**, antes del primer deploy a producción. La rotación periódica de los secrets generados acá vive en `secret-rotation.md`.

---

## 1. Prerrequisitos

- Cuenta Supabase Cloud con plan Pro o superior (free tier no soporta `pg_cron`+`pg_net`, requeridos por las tareas B7).
- Proyecto Vercel ya creado y conectado al repo `ambulante`.
- Acceso a Google Cloud Console (proyecto donde vive el OAuth Client ID — ver [`auth-setup.md`](../workflows/auth-setup.md) si todavía no existe).
- `openssl`, `node` ≥ 20 y `npx` disponibles localmente.

---

## 2. Inventario de lo que se crea en este runbook

| Recurso | Dónde | Cómo se obtiene |
|---|---|---|
| Proyecto Supabase Cloud | dashboard.supabase.com | §3 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | §4.1 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | §4.1 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | §4.1 |
| `DATABASE_URL_POOLER` | Supabase → Settings → Database → Connection pooling | §4.2 |
| `DATABASE_URL_DIRECT` | Supabase → Settings → Database → Connection string | §4.2 |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` | Supabase → Authentication → Providers (lo lee Supabase, no Vercel) | §5 |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` | idem | §5 |
| `CRON_SECRET` | generado local (`openssl rand -hex 32`) | §6.1 |
| `SUPABASE_WEBHOOK_SECRET` | generado local (`openssl rand -hex 32`) | §6.1 |
| `VAPID_PUBLIC_KEY` + `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | generado local (`npx web-push generate-vapid-keys`) | §6.2 |
| `VAPID_PRIVATE_KEY` | idem | §6.2 |
| `VAPID_SUBJECT` | string fija — ver §6.2 | §6.2 |

> **Variables ya existentes (fuera del alcance):** `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_MAP_STYLE_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. Si ya están en Vercel, no se tocan acá.

> **`EDGE_CONFIG`** está declarada como opcional en `shared/config/env.schema.ts` (Vercel Edge Config). Hoy Ambulante no usa la integración — dejar vacía. Si se activa post-MVP, se documenta en su propio runbook.

---

## 3. Crear el proyecto Supabase Cloud

1. Entrar a **dashboard.supabase.com → New project**.
2. **Organization:** la que el equipo use para Ambulante.
3. **Project name:** `ambulante-prod` (sin sufijos de ambiente extra; la URL pública lo identifica).
4. **Database password:** generar con `openssl rand -base64 32` y guardarla en el password manager del equipo. Esta password no se usa en runtime (las URLs de §4.2 ya la incluyen URL-encoded), pero se necesita para `psql` directo y para regenerar las connection strings si se pierden.
5. **Region:** `South America (São Paulo)` — slug interno `sa-east-1` (el pooler antepone su propio prefijo `aws-0-`, ver §4.2). Decisión irreversible: cambiar de región requiere migrar el proyecto entero. La latencia desde Argentina vs `us-east-1` es la diferencia entre ~30ms y ~150ms RTT — crítico para Realtime y para los cron jobs que disparan `pg_net` contra Vercel (los Route Handlers viven en la edge region más cercana).
6. **Pricing plan:** Pro o superior. **No usar Free** — `pg_cron` y `pg_net` (requeridos por B7) sólo están disponibles desde Pro.
7. **Create project** y esperar provisioning (~2 min).

**Verificación:** el dashboard del proyecto muestra "Project is healthy". Anotar el **Project Reference** (formato `xxxxxxxxxxxxxxxxxxxx`, visible en la URL del dashboard y en Settings → General).

---

## 4. Recolectar credenciales del Dashboard

### 4.1 API keys (Settings → API)

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`. Formato: `https://<project-ref>.supabase.co`.
- **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`. JWT firmado con el secret del proyecto, safe en el browser, respaldado por RLS.
- **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`. **Bypasses RLS.** Nunca prefijar con `NEXT_PUBLIC_`. Solo se usa en Route Handlers / Server Actions / cron jobs.

### 4.2 Connection strings (Settings → Database)

> **Regla dura (skill rule `conn-pooling`):** las funciones serverless de Next.js en Vercel **deben** conectarse via el pooler (PgBouncer en transaction mode, puerto 6543). Conectarse al puerto directo desde serverless explota el límite de conexiones del Postgres bajo carga moderada — la skill documenta el caso "500 usuarios concurrentes = 500 conexiones = DB caída".

- **Connection pooling → Transaction → URI** → `DATABASE_URL_POOLER`. Formato:
  `postgresql://postgres.<project-ref>:<password>@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`
  - El pooler **no soporta prepared statements**. Si el cliente Postgres del repo (Drizzle / Prisma / pg directo) los activa por default, hay que desactivarlos cuando la URL apunta al pooler. Ver `conn-prepared-statements.md` en `.claude/skills/supabase-postgres-best-practices/references/` (instalar con `npx skills add https://github.com/supabase/agent-skills --skill supabase-postgres-best-practices -y` si el directorio no existe — `.claude/` está gitignored por diseño, ver CLAUDE.md §10.1).
  - Es la URL que va a Vercel para todos los entornos.

- **Connection string → URI (direct)** → `DATABASE_URL_DIRECT`. Formato:
  `postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres`
  - Reservada **exclusivamente** para CLI: `supabase db push`, `supabase migration up`, `prisma migrate deploy`. No la consume runtime serverless.
  - En Vercel se inyecta sólo en el job de migraciones (B14.2 lo pinea al pipeline de CI; en Vercel runtime queda omitida o sin valor).

**Verificación:** `psql "$DATABASE_URL_POOLER" -c 'select 1'` desde una máquina con red abierta devuelve `1`. Si falla, revisar que la IP esté permitida en Settings → Database → Network restrictions (default: open).

---

## 5. Habilitar Google OAuth en Supabase

> Estos secrets viven **en el dashboard de Supabase**, no en Vercel. Supabase los lee internamente para el flujo OAuth — la app sólo recibe la sesión final via `@supabase/ssr`.

1. **Google Cloud Console → APIs & Services → Credentials → Create credentials → OAuth client ID** (si todavía no existe — ver [`auth-setup.md`](../workflows/auth-setup.md) para los scopes y redirect URIs).
2. **Authorized redirect URIs** del OAuth client: agregar `https://<project-ref>.supabase.co/auth/v1/callback` (Supabase requiere ese callback exacto).
3. Copiar **Client ID** y **Client secret**.
4. **Supabase → Authentication → Providers → Google → Enable** y pegar Client ID + Secret.
5. **Authentication → URL Configuration:**
   - **Site URL:** `https://ambulante.app` (o el dominio definitivo de prod).
   - **Redirect URLs:** agregar `https://ambulante.app/**`, `https://*.vercel.app/**` (para previews), y `http://localhost:3000/**` si se quiere debuggear contra prod desde local (no recomendado, solo si el equipo ya lo decidió).

**Verificación:** desde el dashboard, Authentication → Users → Sign in with Google completa el flujo sin error.

---

## 6. Generar secrets locales

### 6.1 `CRON_SECRET` y `SUPABASE_WEBHOOK_SECRET`

```sh
openssl rand -hex 32   # CRON_SECRET
openssl rand -hex 32   # SUPABASE_WEBHOOK_SECRET
```

- `CRON_SECRET` lo comparten `pg_cron`/`pg_net` (DB) y los Route Handlers `/api/cron/*` (Vercel). El header `X-Cron-Secret` viaja en cada request del job; B7.1 ya implementa la validación.
- `SUPABASE_WEBHOOK_SECRET` autentica los Database Webhooks de Supabase contra los endpoints de la app (cuando se configuren — ver B11-B audit log).
- Ambos van **únicamente** en variables server-only (sin prefijo `NEXT_PUBLIC_`). Mínimo 16 caracteres (el schema valida); 64 hex chars (32 bytes) es lo recomendado.
- Guardar también en el password manager — si se pierden, hay que regenerar y rotar simultáneamente DB-side y Vercel-side (downtime corto).

### 6.2 VAPID (Web Push)

```sh
npx web-push generate-vapid-keys --json
```

- Output JSON con `publicKey` y `privateKey` (URL-safe base64).
- `VAPID_PUBLIC_KEY` y `NEXT_PUBLIC_VAPID_PUBLIC_KEY` deben tener **el mismo valor** (el schema lo valida en `superRefine`).
- `VAPID_PRIVATE_KEY` queda únicamente en server-only.
- `VAPID_SUBJECT` = `mailto:push@ambulante.app` (o la URL https:// de contacto del equipo). Es lo que los push services (FCM/APNS) ven como "remitente" del push.

> **Recordatorio crítico:** si después se rotan las claves VAPID, **todas** las suscripciones push existentes quedan invalidadas. Ver `secret-rotation.md` §3.5.

---

## 7. Inyectar secrets en Vercel

> **Vercel → [Project] → Settings → Environment Variables.** Para cada variable, elegir el **scope** correcto y los **environments** que aplican.

| Variable | Environments | Scope sensible |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Plain (se embebe en bundle del cliente) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Plain (se embebe en bundle) |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | **Sensitive** |
| `DATABASE_URL_POOLER` | Production, Preview | **Sensitive** |
| `DATABASE_URL_DIRECT` | (sólo se inyecta en el step de migraciones de CI — ver B14.2) | **Sensitive** |
| `CRON_SECRET` | Production, Preview | **Sensitive** |
| `SUPABASE_WEBHOOK_SECRET` | Production, Preview | **Sensitive** |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Production, Preview, Development | Plain (browser) |
| `VAPID_PUBLIC_KEY` | Production, Preview | **Sensitive** |
| `VAPID_PRIVATE_KEY` | Production, Preview | **Sensitive** |
| `VAPID_SUBJECT` | Production, Preview | Plain |

**Notas operativas:**

- "Preview" cubre todos los deploys de PR. Para B14.1 inicial, los previews pueden compartir credenciales con prod si todavía no hay branch DBs (B14.2 introduce branching opcional). Documentado como riesgo conocido — los previews no se exponen públicamente y los repos no son públicos.
- "Development" cubre `vercel dev` localmente. Para devs locales, lo correcto es seguir usando `pnpm supabase:start` (Supabase local) — no apuntar el dev local a la cloud salvo que un dev específicamente quiera reproducir un bug de prod.
- **No setear** `NODE_ENV` manualmente; Vercel lo gestiona.
- **No usar** scope "Team" para secrets de Ambulante salvo que el equipo decida explícitamente compartir credenciales cross-projects. Default: scope = proyecto.

---

## 8. Verificación post-setup

Antes de hacer el primer deploy real:

1. **Schema parse local** (con un `.env.production.local` temporal o usando `vercel env pull`):
   ```sh
   vercel env pull .env.production.local --environment=production
   pnpm typecheck
   pnpm test -- env.schema
   ```
   Si el schema rechaza algo, corregir en Vercel antes de deployar.
2. **Trigger de un deploy de Preview** desde un PR (puede ser un PR no-op contra `main`). El build debe completar sin errores de "Configuración inválida de variables de entorno" (mensaje del parser de Zod).
3. **Smoke test con curl:**
   ```sh
   curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" | head -c 200
   ```
   Debe responder con un JSON de OpenAPI no vacío.
4. **Pooler:** `psql "$DATABASE_URL_POOLER" -c 'show port'` retorna `6543`.
5. **Direct:** `psql "$DATABASE_URL_DIRECT" -c 'show port'` retorna `5432`.
6. **Auth Google:** desde el preview deploy, completar el flujo de sign-in con Google. La sesión debe persistir tras refresh.

---

## 9. Pitfalls comunes

- **Vercel mete `\n` invisibles** cuando se pegan keys multilínea (passwords con saltos de línea). Si una connection string falla con error de parsing, regenerarla limpia.
- **Pool mode "session" en lugar de "transaction"** rompe Vercel serverless: cada función queda con la conexión abierta hasta que el contenedor muere. Verificar que la URL del pooler diga `pgbouncer=true&pool_mode=transaction` en query string si Supabase lo expone explícito.
- **Project Reference distinto** entre URL y connection string: si copiás la URL del proyecto A pero las connection strings del proyecto B (típico cuando hay varios proyectos abiertos en pestañas), el deploy parece OK pero los queries fallan con `JWT signature mismatch`. Verificar que los 4 valores (`SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `DATABASE_URL_*`) provengan del mismo `<project-ref>`.
- **Google OAuth callback hardcoded a localhost:** si en Cloud Console quedó sólo `http://localhost:54321/auth/v1/callback`, prod va a fallar con `redirect_uri_mismatch`. Verificar que el callback de Supabase Cloud (`https://<project-ref>.supabase.co/auth/v1/callback`) está en la lista.
- **VAPID `subject` con formato inválido** (ej: `push@ambulante.app` sin `mailto:`): el schema lo rechaza al boot. Usar `mailto:push@ambulante.app` o una URL `https://`.

---

## 10. Rollback

Este runbook crea recursos pero **no destruye nada existente**. Si algo sale mal en prod:

- **Antes del primer deploy:** borrar el proyecto Supabase y recrearlo. Desactivar las env vars en Vercel (no borrarlas, así queda historial). Documentar la causa en el canal del equipo.
- **Después del primer deploy:** **no** borrar el proyecto Supabase — la data ya importa. Para incidentes con secrets comprometidos, seguir `secret-rotation.md` con el procedimiento de emergencia. Para problemas de configuración (URL mala, region mala), abrir un nuevo proyecto Supabase, migrar via `supabase db dump | psql`, repointear Vercel y luego cerrar el proyecto viejo. Esa migración tiene downtime — coordinar con el equipo.

---

## 11. Fuera del alcance

- **Pipeline de CI con preview DB por PR + approval gate:** [`B14.2`](../epic-backend/tasks/B14.2.md).
- **Release-please** para automatizar release notes y tags: [`B14.3`](../epic-backend/tasks/B14.3.md).
- **Go-live checklist + disaster recovery baseline:** [`B14.4`](../epic-backend/tasks/B14.4.md).
- **Rotación periódica de los secrets generados acá:** [`secret-rotation.md`](./secret-rotation.md). Este runbook reemplaza al placeholder `supabase-credentials.md` que `secret-rotation.md` §6 anticipaba.
- **Custom domain en Supabase Auth** (`auth.ambulante.app` en vez de `<project-ref>.supabase.co`): es un upgrade a Pro+ con configuración DNS adicional. Decisión post-go-live.
- **Network restrictions / IP allowlist** en Supabase: por default abierto. Restringir a IPs de Vercel se evalúa post-go-live (Vercel no garantiza IPs estáticas en planes estándar — requiere Vercel Enterprise o un proxy intermedio).
