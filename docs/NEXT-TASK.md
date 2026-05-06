# NEXT-TASK — Parking lot de mejoras y deferred items

> **Qué es este doc:** lista estructurada de **todo lo que quedó fuera de scope** del MVP o de los epics activos (frontend ✅ / backend en curso) y vale la pena retomar cuando toque. No es un backlog de features nuevas — es el registro de cosas que vimos que mejorarían el producto pero decidimos no hacer ahora.
>
> **Cómo se alimenta:** cuando al ejecutar una tarea del epic descubrís una mejora fuera de su scope, la agregás acá. **Nunca** ensucies el epic con cosas "nice-to-have" — se merecen su propio registro.
>
> **Cómo se saca algo de acá:** cuando decidas ejecutar un item, lo movés a un epic (frontend, backend, o uno nuevo) con un Task ID del prefijo correspondiente, y lo quitás de este doc. El ID `NT-NN` queda en el historial del commit como referencia.

---

## Formato por item

```markdown
### NT-NN — Título accionable
- **Categoría:** qué dominio toca (UX, infra, backend, a11y, perf, negocio)
- **Contexto:** qué es, por qué está fuera del MVP, qué problema resuelve cuando se retome.
- **Aceptación:** criterio verificable de "esto está hecho".
- **Archivos afectados:** paths absolutos o relativos con los que probablemente se toque.
- **Estimación:** S/M/L/XL o "a definir".
- **Cuándo retomarlo:** disparadores que hacen que valga la pena priorizarlo
  (ej: "cuando crezca el equipo", "post primer 100 usuarios", "si una métrica X cae").
- **Dependencias:** otros items o tareas que deben estar ✅.
- **Ticket:** link a issue/PR cuando se escale (vacío hasta entonces).
- **Notas:** cualquier detalle extra útil para el futuro.
```

---

## Índice

| ID | Título | Categoría | Estimación | Disparador |
|---|---|---|---|---|
| [NT-01](#nt-01--mejorar-la-ui-bloque-abierto-a-detallar) | Mejorar la UI (bloque abierto — a detallar) | UX | TBD | a definir por usuario |
| [NT-02](#nt-02--previsualizador-de-imagen-al-crear-o-editar-producto) | Previsualizador de imagen al crear/editar producto | UX / catálogo | S | uso real del CRUD de catálogo |
| [NT-03](#nt-03--precarga-de-theme-evitar-flash-blanco--dark) | Precarga de theme (evitar flash blanco → dark) | UX / perf frontend | M | quejas de usuarios sobre flash visual |
| [NT-04](#nt-04--apple-oauth-sign-in-with-apple) | Apple OAuth (Sign in with Apple) | auth / backend | M | >20% de usuarios en iOS instalando PWA |
| [NT-05](#nt-05--avatar-de-usuario--bucket--ui) | Avatar de usuario + bucket + UI | storage / UX | M | feature de perfil cliente prioritaria |
| [NT-06](#nt-06--entorno-staging-supabase) | Entorno staging (Supabase Cloud) | infra | M | >1 dev en el equipo |
| [NT-07](#nt-07--supabase-branching-por-pr) | Supabase Branching por PR | infra / DevEx | M | >3 PRs/semana con cambios de schema |
| [NT-08](#nt-08--migrar-public_id-a-uuidv7) | Migrar `public_id` de UUIDv4 a UUIDv7 | schema / perf | L | tablas > 10M filas con queries por public_id lentas |
| [NT-09](#nt-09--rate-limiting-migrar-in-db-a-upstashredis) | Rate limiting: migrar in-DB a Upstash/Redis | infra / perf | L | >1000 req/s o queries de rate_limit_buckets lentas |
| [NT-10](#nt-10--visual-regression-tests-storybook) | Visual regression tests (Storybook) | testing / UX | L | >3 bugs visuales en 30 días |
| [NT-11](#nt-11--monorepo-evaluation-turborepo) | Monorepo evaluation (Turborepo) | infra / DevEx | XL | >2 projects que comparten código |
| [NT-12](#nt-12--purga-periódica-de-audit_log-y-store_locations) | Purga periódica de audit_log y store_locations | backend / data retention | M | crecimiento > 10GB en esas tablas |
| [NT-13](#nt-13--rating--reputación-bidireccional) | Rating / reputación bidireccional | producto | XL | PRD §12.1 prioritizado post-MVP |
| [NT-14](#nt-14--chat-en-vivo-cliente--tienda) | Chat en vivo cliente ↔ tienda | producto | XL | PRD §12.1 prioritizado post-MVP |
| [NT-15](#nt-15--favoritos--seguimiento-de-tiendas) | Favoritos + seguimiento de tiendas | producto | L | PRD §12.1 |
| [NT-16](#nt-16--notificaciones-por-proximidad) | Notificaciones por proximidad | producto | L | PRD §12.1 |
| [NT-17](#nt-17--programación-anticipada-de-pedidos) | Programación anticipada de pedidos | producto | L | PRD §12.1 |
| [NT-18](#nt-18--sistema-de-filtros-por-categoría-de-producto) | Sistema de filtros por categoría de producto | producto / UX | M | PRD §12.1 |
| [NT-19](#nt-19--promociones-y-descuentos-publicables-por-tienda) | Promociones y descuentos publicables por tienda | producto / negocio | L | PRD §12.2 |
| [NT-20](#nt-20--verificación-de-identidad-kyc-para-tiendas) | Verificación de identidad (KYC) para tiendas | negocio / compliance | L | regulación local lo exige |
| [NT-21](#nt-21--modelo-de-monetización-suscripción-premium-para-tiendas) | Modelo de monetización: suscripción premium para tiendas | negocio | XL | PRD §12.2, traction alcanzada |
| [NT-22](#nt-22--predicción-de-demanda-ml-sobre-históricos) | Predicción de demanda (ML sobre históricos) | data / ML | XL | >6 meses de data histórica |
| [NT-23](#nt-23--modo-offline-completo-con-sincronización-diferida) | Modo offline completo con sincronización diferida | PWA / perf | XL | >30% de usuarios en zonas de conectividad mala |
| [NT-24](#nt-24--app-nativa-ios-si-la-pwa-topa-límites) | App nativa iOS si la PWA topa límites | plataforma | XL | push en iOS sin PWA-install sigue sin estar disponible |
| [NT-25](#nt-25--observabilidad-avanzada-opentelemetry) | Observabilidad avanzada (OpenTelemetry) | infra / obs | L | incidentes requieren trace distribuido |
| [NT-43](#nt-43--fetchauditlog-devuelve-null-tanto-para-pedido-sin-entradas-como-para-errores-de-supabase) | `fetchAuditLog` devuelve null para not-found y para errores — admin no puede distinguir | backend / UX admin | M | admin reporta confusión al auditar pedidos |
| [NT-27](#nt-27--mover-alter-database-set-de-seedsql-a-una-migración) | Mover `ALTER DATABASE SET` de seed.sql a migración | infra / DX | S | al reabrir el epic de cron jobs (B7.x) |
| [NT-28](#nt-28--agregar-received_at-a-la-tabla-orders) | Agregar `received_at` a la tabla `orders` | schema / backend | S | cuando `expiredAt` en audit trail requiera timestamp exacto de recepción |
| [NT-29](#nt-29--resizeimageforupload-tipar-dimensions-como-nullable-en-el-no-op-path) | `resizeImageForUpload`: tipar dimensions como nullable en el no-op path | DX / types | S | al integrar el helper en B10.3 (Swap catálogo CRUD + image upload) |
| [NT-34](#nt-34--paginación-real-en-listado-admin-de-usuarios) | Paginación real en listado admin de usuarios | backend / perf | M | tabla `users` > 500 filas en prod |
| [NT-35](#nt-35--focus-trap--escape-en-suspendconfirmdialog-y-otros-modales-admin) | Focus trap + Escape en `SuspendConfirmDialog` y otros modales admin | a11y / UX | M | auditoría de a11y o feedback de usuarios con teclado |
| [NT-38](#nt-38--borrar-features-orders-services-orders-mock-tras-cierre-de-b10-c) | Borrar `features/orders/services/orders.mock.ts` tras cierre de B10-C | refactor / cleanup | S | al cerrar B10-C (manejo de pedidos lado tienda) |
| [NT-39](#nt-39--e2e-happy-path-cliente-cart--submit--tracking--cancel--history) | E2E happy path cliente (cart → submit → tracking → cancel → history) | testing / E2E | M | Supabase local con seed completo + VAPID keys + SW registrado |
| [NT-42](#nt-42--relajar-store-zod-schema-photourl--tagline--pricefromars-deben-ser-opcionales) | Relajar `Store` Zod schema: `photoUrl` / `tagline` / `priceFromArs` deben ser opcionales | backend / types | M | junto con B10-A.3 (perfil) o cuando profile editor esté listo |

---

## Items

### NT-01 — Mejorar la UI (bloque abierto — a detallar)
- **Categoría:** UX
- **Contexto:** **A definir por el usuario.** Este item está marcado como placeholder porque hay una intuición de mejoras visuales/UX pendientes pero todavía no está listado el detalle. El usuario conoce los puntos; falta descomponerlos acá.
- **Aceptación:** _(a completar cuando se descompongan los sub-items)_
- **Archivos afectados:** _(a completar)_
- **Estimación:** TBD — se define cuando se descomponga.
- **Cuándo retomarlo:** cuando el usuario tenga 15-30 min para escribir los puntos concretos que tenía en mente.
- **Dependencias:** —
- **Ticket:** —
- **Notas:**
  > **Plantilla para descomponer (usar al retomar):**
  > Reemplazar este bloque por NT-01a, NT-01b, NT-01c… cada uno siguiendo el formato estándar. Ejemplos de sub-items que **podrían** caer acá (a confirmar con el usuario):
  > - Spacing / ritmo vertical inconsistente entre cards y listas.
  > - Paleta de colores (branding) no 100% asentada en modo dark.
  > - Microinteracciones (hover, focus, press) en botones y links.
  > - Loading states y skeletons en pantallas con data.
  > - Estados vacíos con mejor copy e ilustración.
  > - Transiciones entre rutas.
  > - Consistencia de tipografía (jerarquía h1-h6, labels, captions).
  > - Feedback visual en formularios (error, success, warning).

---

### NT-02 — Previsualizador de imagen al crear o editar producto
- **Categoría:** UX / catálogo
- **Contexto:** En el CRUD de productos (features/catalog), al pegar una URL de imagen o subir un archivo, la UI no muestra preview hasta que se guarda el registro. Friction para la tienda que necesita verificar que la imagen cargó bien y se ve derecha antes de publicar.
- **Aceptación:** Al pegar URL o al seleccionar archivo para upload, se renderiza un thumbnail inmediato (client-side si es upload; via `<img>` directo si es URL) con tamaños de crop que coinciden con los de display real. Error visible si la imagen no carga (URL rota, 404, mime inválido).
- **Archivos afectados:** `features/catalog/components/ProductForm/`, `features/catalog/components/ProductImagePreview/` (nuevo).
- **Estimación:** S
- **Cuándo retomarlo:** después de B10.3 (Swap catálogo CRUD) — una vez que storage real esté conectado, este preview complementa la UX del upload.
- **Dependencias:** B10.3 ✅ o antes si se quiere como mejora pura de UI sobre el mock.
- **Ticket:** —
- **Notas:** Considerar también validación de aspect ratio (forzar 4:3 o 1:1 para consistencia de feed) con crop tool simple.

---

### NT-03 — Precarga de theme (evitar flash blanco → dark)
- **Categoría:** UX / perf frontend
- **Contexto:** En producción, la primera carga de cualquier página arranca con fondo blanco y conmuta a dark cuando el `ThemeProvider` hidrata. Es un FOUC (flash of unstyled content) visible especialmente en mobile donde es lo primero que ve el usuario. Problema clásico de SSR + client-side theme — hay que inyectar la paleta inicial en el HTML del server para que el primer paint ya sea el correcto.
- **Aceptación:** Lighthouse muestra 0 CLS inducido por cambio de theme. La primera pintura de `/` en dark mode no pasa por blanco. Funciona con `prefers-color-scheme` sin tocar localStorage de primera. Lighthouse Perf ≥ 90 se mantiene.
- **Archivos afectados:** `app/layout.tsx` (inyectar script inline que setea `data-theme` antes de React hidrate), `shared/providers/ThemeProvider.tsx`, `app/globals.css` (CSS variables desde `:root[data-theme="dark"]`).
- **Estimación:** M
- **Cuándo retomarlo:** después de B4 (auth real) — cuando el tema persista por sesión del user autenticado y el flash sea más notorio al login. O antes si se escalan quejas de usuarios en testing interno.
- **Dependencias:** ninguna dura. F9.6 (dark mode audit ✅) sigue vigente.
- **Ticket:** —
- **Notas:** Patrón canónico: `<script>` inline en `<head>` que lee `localStorage` + `prefers-color-scheme` y setea `document.documentElement.dataset.theme` **antes** del primer render. Los css vars de `:root[data-theme="dark"]` ya deben existir.

---

### NT-04 — Apple OAuth (Sign in with Apple)
- **Categoría:** auth / backend
- **Contexto:** En el brainstorming se decidió arrancar con email + magic link + Google OAuth (B4 del epic). Apple OAuth se difirió por: (a) costo de Apple Developer account ($99/año), (b) complejidad de certificados, (c) bajo volumen inicial. Cuando el % de usuarios iOS instalando PWA suba, Apple Sign In pasa de nice-to-have a expected.
- **Aceptación:** Usuario puede loguear con "Continuar con Apple" en el login page. Session persiste igual que con otros providers. Funciona en iOS Safari standalone (PWA instalada).
- **Archivos afectados:** `supabase/config.toml` (enable apple provider), `features/auth/components/LoginButtons/`, `docs/workflows/auth-setup.md` (pasos para la Apple Developer app).
- **Estimación:** M
- **Cuándo retomarlo:** cuando >20% de usuarios activos sean iOS y/o cuando el equipo ya tenga Apple Developer account por otra razón.
- **Dependencias:** B4 ✅ (auth real).
- **Ticket:** —
- **Notas:** Apple OAuth requiere JWT signing con una private key — Supabase lo soporta nativo, la fricción es generar el certificate en Apple Developer Portal.

---

### NT-05 — Avatar de usuario + bucket + UI
- **Categoría:** storage / UX
- **Contexto:** El brainstorming decidió que storage scope MVP cubre productos + logos de tienda + documentos de validación. Avatar de usuario se difirió porque el PRD §5.1 no lo lista como feature crítica y el profile cliente es minimalista. Cuando se agregue reputación o interacciones sociales (NT-13), un avatar tiene sentido.
- **Aceptación:** Bucket `avatars` existe con RLS (user escribe solo su propio path). Componente `<UserAvatar>` reutilizable. Upload con crop circular y resize a 256x256.
- **Archivos afectados:** `supabase/migrations/<ts>_avatars_bucket.sql`, `shared/components/UserAvatar/`, `features/profile/components/AvatarUpload/`, `shared/services/storage.supabase.ts` (patch).
- **Estimación:** M
- **Cuándo retomarlo:** cuando se priorice NT-13 (rating/reputación) o cuando el feedback de usuarios pida poner cara al perfil.
- **Dependencias:** B5 ✅ (storage operativo).
- **Ticket:** —
- **Notas:** Si NT-13 se arranca, hacer primero esta tarea para dar identidad visual a los actores del rating.

---

### NT-06 — Entorno staging (Supabase Cloud)
- **Categoría:** infra
- **Contexto:** El brainstorming decidió MVP con dev local + prod solo (sin staging) para mantener simple y barato. Cuando el equipo crezca y haya demos/QA manual pre-release, un entorno staging aislado se vuelve necesario.
- **Aceptación:** Proyecto Supabase Cloud separado (ej: `ambulante-staging`). Pipeline CI despliega a staging en cada merge a `develop` (o `main` según gitflow). Envs separados en Vercel (preview apuntando a staging; prod a prod). Secretos separados.
- **Archivos afectados:** `.github/workflows/deploy-staging.yml` (nuevo), `docs/runbooks/staging-setup.md`, env vars en Vercel + Supabase dashboards.
- **Estimación:** M
- **Cuándo retomarlo:** cuando haya >1 desarrollador regular en el proyecto o cuando se necesite QA manual antes de prod.
- **Dependencias:** B14 ✅ (prod funcionando).
- **Ticket:** —
- **Notas:** Alternativa más barata: usar Supabase Branching (NT-07) como "staging por PR". Depende del flujo del equipo.

---

### NT-07 — Supabase Branching por PR
- **Estado:** ⏸️ deferred
- **Categoría:** infra / DevEx
- **Contexto:** Supabase Branching crea una base fresca por PR (schema + data aislados). Permite testear migraciones contra un entorno idéntico a prod sin afectar a otros. Descartado en el brainstorming porque está en beta, cuesta $10/mes/proyecto, y para un equipo chico no paga.
- **Aceptación:** Cada PR que toca `supabase/migrations/` dispara un Supabase Branch, corre migraciones + tests E2E, reporta resultado en el PR. Al mergear, el branch se destruye.
- **Archivos afectados:** `.github/workflows/supabase-branch.yml` (nuevo), config en Supabase dashboard.
- **Estimación:** M
- **Cuándo retomarlo:** cuando haya >3 PRs/semana que toquen schema y los conflicts de migraciones se vuelvan dolorosos, O cuando el tier contratado incluya branching gratis.
- **Dependencias:** B14 ✅.
- **Ticket:** —
- **Notas:** Saltar NT-06 (staging dedicado) si se adopta NT-07 — branching lo reemplaza para casi todos los casos.

---

### NT-08 — Migrar `public_id` de UUIDv4 a UUIDv7
- **Categoría:** schema / perf
- **Contexto:** BD-6 del epic backend: MVP usa `gen_random_uuid()` (UUIDv4, random) para IDs expuestos al cliente. La skill `supabase-postgres-best-practices` rule `schema-primary-keys` documenta que UUIDv4 causa fragmentación de índices en tablas grandes. UUIDv7 es time-ordered y elimina la fragmentación, pero requiere la extensión `pg_uuidv7` (no disponible por default en Supabase — hay que habilitarla o emular con función SQL).
- **Aceptación:** Tablas con `public_id` usan UUIDv7. Índices de `public_id` muestran menor fragmentación en `pg_stat_user_indexes`. Migración de IDs existentes sin breaking changes en URLs ni referencias externas.
- **Archivos afectados:** `supabase/migrations/<ts>_uuidv7_extension.sql`, `<ts>_migrate_public_ids_to_v7.sql`, update de defaults en tablas.
- **Estimación:** L
- **Cuándo retomarlo:** cuando alguna tabla con `public_id` supere 10M filas, O cuando `pg_stat_statements` muestre queries de lookup por public_id crecer en mean_exec_time.
- **Dependencias:** B1.2 ✅, B14 ✅ (prod). No hacer antes de prod — probar primero en staging o local con data sintética a escala.
- **Ticket:** —
- **Notas:** Alternativa sin extensión: función SQL `uuid_generate_v7()` implementada como `text + gen_random_uuid()` (ver skill rule ejemplo). Más portable pero un poco más lento que la extensión nativa.

---

### NT-09 — Rate limiting: migrar in-DB a Upstash/Redis
- **Categoría:** infra / perf
- **Contexto:** B13.1 del epic backend implementa rate limiting contra una tabla Postgres (`rate_limit_buckets`). Funciona bien para MVP pero tiene dos limitaciones: (a) cada check hace una query a la DB, que compite con el tráfico real; (b) no escala a rate limits global (IPs desconocidas). Upstash / Redis resolvería ambos: latencia <1ms por check, cuota global en memoria distribuida.
- **Aceptación:** Middleware invoca Upstash en vez de la tabla Postgres. Tabla vieja se mantiene como fallback o se borra con migration. Latencia de checks cae 10x en p95.
- **Archivos afectados:** `shared/services/rate-limit.upstash.ts` (nuevo), `shared/services/index.ts` (factory), `supabase/migrations/<ts>_drop_rate_limit_table.sql` (opcional).
- **Estimación:** L
- **Cuándo retomarlo:** cuando el tráfico supere ~1000 req/s o cuando `pg_stat_statements` muestre `check_rate_limit` entre las top 10 queries por calls.
- **Dependencias:** B13.1 ✅.
- **Ticket:** —
- **Notas:** Upstash tiene free tier (10k commands/day) suficiente para validar el approach antes de comprometer pago.

---

### NT-10 — Visual regression tests (Storybook)
- **Categoría:** testing / UX
- **Contexto:** F9.5 del epic frontend quedó como `⏸️ deferred` — Storybook + snapshot testing de componentes. Útil cuando el equipo crece y los cambios visuales se multiplican. Para MVP con 1 dev, overhead > valor.
- **Aceptación:** Storybook corre con todos los componentes de `shared/components/ui/`. Chromatic o similar toma snapshots en PR. Visual diffs bloquean merge si no se aprueban.
- **Archivos afectados:** `.storybook/`, `*.stories.tsx` por componente, CI workflow.
- **Estimación:** L (setup) + S por componente que se agregue.
- **Cuándo retomarlo:** cuando haya >3 bugs visuales por regresión en 30 días, o cuando entren designers al equipo y quieran review visual.
- **Dependencias:** —
- **Ticket:** —
- **Notas:** Considerar alternativa más liviana: Playwright `toHaveScreenshot()` tests sobre páginas clave. Menos overhead de setup que Storybook.

---

### NT-11 — Monorepo evaluation (Turborepo)
- **Categoría:** infra / DevEx
- **Contexto:** DP-8 del epic frontend decidió "NO monorepo" para MVP (single repo Next.js + Supabase). Si en el futuro surgen proyectos que comparten código (ej: app nativa iOS via NT-24, panel admin separado, servicio worker dedicado), un monorepo con Turborepo + pnpm workspaces se justifica.
- **Aceptación:** Estructura `apps/web`, `apps/mobile`, `packages/shared`, `packages/ui`. Build caching funciona. CI paraleliza por package.
- **Archivos afectados:** movimientos grandes de directorios; `turbo.json` nuevo; `package.json` root reestructurado.
- **Estimación:** XL
- **Cuándo retomarlo:** cuando haya 2+ apps que compartan código, no antes.
- **Dependencias:** NT-24 u otro driver real. No hacerlo preemptivo.
- **Ticket:** —
- **Notas:** Hay que migrar el epic de paralelización por worktrees al patrón monorepo, que cambia cómo se aíslan los trabajos paralelos.

---

### NT-12 — Purga periódica de audit_log y store_locations
- **Categoría:** backend / data retention
- **Contexto:** BD-1 y BD-2 del epic backend: `audit_log` se retiene indefinidamente en MVP (simple); `store_locations` 30 días por costo. Sin purga automática, ambos crecen linealmente. `store_locations` especialmente rápido (INSERT cada 30-60s por tienda activa × N tiendas).
- **Aceptación:** Cron job `/api/cron/purge-old-data` que corre 1×/día a las 3am AR. Borra `store_locations` con `created_at < now() - 30 days` en batches de 10k (para no generar lock contention). Archiva `audit_log > 2 años` a JSON en storage frío (opcional) y borra. Métricas de rows eliminadas logueadas.
- **Archivos afectados:** `app/api/cron/purge-old-data/route.ts`, schedule en `supabase/migrations/<ts>_schedule_purge.sql`.
- **Estimación:** M
- **Cuándo retomarlo:** cuando la suma de las 2 tablas supere 10 GB, O cuando `supabase db dump` tarde > 10 min.
- **Dependencias:** B7.1 ✅.
- **Ticket:** —
- **Notas:** Usar `delete from ... where id in (select ... limit 10000 for update skip locked)` para batching seguro (skill rule lock-skip-locked).

---

### NT-13 — Rating / reputación bidireccional
- **Categoría:** producto
- **Contexto:** PRD §12.1 lista "sistema de reputación bidireccional" como mejora futura post-MVP. Decisión explícita en PRD §5: no hay ratings en MVP para mantener simple. Cuando haya tracción y casos de disputa, un rating mutuo cliente↔tienda incentiva comportamiento.
- **Aceptación:** Tabla `ratings`, UI para rate en el flow "post-FINALIZADO", agregado en `stores.avg_rating` via trigger o view materializada, filtro en mapa "rating > X". Moderación de rating spam via admin.
- **Archivos afectados:** migración schema, `features/ratings/`, `features/map/` (filtro), `features/admin-ratings/` (moderación).
- **Estimación:** XL
- **Cuándo retomarlo:** cuando el producto tenga tracción confirmada (>1k pedidos/mes) y empiecen disputas.
- **Dependencias:** B14 ✅ (prod con users reales).
- **Ticket:** —
- **Notas:** Correlacionar con NT-05 (avatars) — un rating con foto tiene más peso social.

---

### NT-14 — Chat en vivo cliente ↔ tienda
- **Categoría:** producto
- **Contexto:** PRD §2.3 explicitó que el MVP **no incluye chat** — la coordinación va por estados del pedido. PRD §12.1 lo lista como mejora futura. Cuando los estados sean insuficientes (ej: cliente necesita avisar "estoy llegando en 5" o tienda quiere indicar "vine con poco de X"), un chat corto resuelve.
- **Aceptación:** Chat in-app solo entre cliente y tienda de un pedido específico. Se abre al `ACEPTADO` y se cierra al `FINALIZADO`/`CANCELADO`. No es chat general; es canal del pedido. Moderación automática de spam.
- **Archivos afectados:** nueva feature `features/order-chat/`, tabla `order_messages`, realtime channel dedicado, UI fase inbox tienda + tracking cliente.
- **Estimación:** XL
- **Cuándo retomarlo:** cuando feedback de usuarios muestre pedidos fallidos por falta de comunicación (métricas `CANCELADO` con motivo "no llegué").
- **Dependencias:** B14 ✅, B6 ✅.
- **Ticket:** —
- **Notas:** Empezar minimal: mensajes de texto, sin adjuntos, sin voice.

---

### NT-15 — Favoritos + seguimiento de tiendas
- **Categoría:** producto
- **Contexto:** PRD §12.1 — cliente marca tiendas favoritas para verlas destacadas o recibir notifs cuando entran en radio.
- **Aceptación:** Botón "favorito" en store detail. Tab "mis favoritos" en profile cliente. Opcionalmente: notif push al favorito entrar en radio (combina con NT-16).
- **Archivos afectados:** tabla `user_favorites`, `features/profile/`, `features/map/` (marker distintivo para favoritos).
- **Estimación:** L
- **Cuándo retomarlo:** cuando haya métricas de "clientes que vuelven a la misma tienda" > 20%.
- **Dependencias:** B9 ✅.
- **Ticket:** —
- **Notas:** Es puerta de entrada a NT-16 y a engagement recurrente.

---

### NT-16 — Notificaciones por proximidad
- **Categoría:** producto
- **Contexto:** PRD §12.1 — avisar al cliente "tu tienda favorita está a 500m". Útil para engagement post-favoritos (NT-15).
- **Aceptación:** Cron (o evento) que detecta cuando una tienda favorita del usuario entra en su radio (usando última ubicación reportada por la tienda y la del cliente). Dispara push al usuario.
- **Archivos afectados:** cron job, integración con Push (B8), opción en profile de cliente para habilitar/deshabilitar.
- **Estimación:** L
- **Cuándo retomarlo:** post NT-15.
- **Dependencias:** NT-15, B8 ✅.
- **Ticket:** —
- **Notas:** Cuidado con privacy — la tienda no debe saber que el cliente la tiene de favorita (revelaría patrones). El cliente debe poder apagarlo.

---

### NT-17 — Programación anticipada de pedidos
- **Categoría:** producto
- **Contexto:** PRD §12.1 — "reservar pedido para un horario futuro" (ej: "quiero café mañana 8am"). Cambia el modelo mental del producto: de "intención de compra ahora" a "agenda de compra".
- **Aceptación:** Flow de "programar para más tarde" en el submit order. Estado nuevo `PROGRAMADO` en la state machine. Transición automática `PROGRAMADO → ENVIADO` a la hora programada. Cancelación del cliente hasta N minutos antes.
- **Archivos afectados:** state machine (ampliación), UI submit, cron que activa pedidos programados.
- **Estimación:** L
- **Cuándo retomarlo:** cuando el feedback muestre pedidos de "le pregunto a mi colega si quiere uno y pido".
- **Dependencias:** B9 ✅, B7 ✅.
- **Ticket:** —
- **Notas:** Puede complicar el flow — evaluar si invalida la UX actual antes de compromete.

---

### NT-18 — Sistema de filtros por categoría de producto
- **Categoría:** producto / UX
- **Contexto:** PRD §12.1 — filtrar mapa por "comida", "bebida", "producto específico". Hoy el mapa muestra todas las tiendas activas sin distinción.
- **Aceptación:** Categoría agregada al schema de productos/tiendas. Chips de filtro en el feed del mapa. Query PostGIS con filtro por categoría.
- **Archivos afectados:** migración (add column), `features/map/`, `features/catalog/`.
- **Estimación:** M
- **Cuándo retomarlo:** cuando haya >50 tiendas activas y el mapa se vea ruidoso sin filtros.
- **Dependencias:** B9.2 ✅.
- **Ticket:** —
- **Notas:** Empezar con categorías hardcoded (comida / bebida / otros) y después abrir a taxonomía.

---

### NT-19 — Promociones y descuentos publicables por tienda
- **Categoría:** producto / negocio
- **Contexto:** PRD §12.2 — "2x1 hoy", "descuento del 20% antes de las 12". Feature que atrae a la tienda y activa a clientes.
- **Aceptación:** Tabla `promotions` asociada a store o producto. UI en dashboard tienda para crear. Render en store detail + mapa (badge "🏷️").
- **Archivos afectados:** schema, `features/promotions/`, `features/map/` (badge).
- **Estimación:** L
- **Cuándo retomarlo:** cuando tiendas lo pidan en entrevistas/support.
- **Dependencias:** B10 ✅.
- **Ticket:** —
- **Notas:** Posible driver de NT-21 (monetización — promos destacadas premium).

---

### NT-20 — Verificación de identidad (KYC) para tiendas
- **Categoría:** negocio / compliance
- **Contexto:** PRD §12.2. B11.2 (store validation) usa docs subidos (DNI, habilitación) revisados por admin. KYC real agrega validación automatizada via un provider (Veriff, Onfido, etc.) — check de identidad más robusto.
- **Aceptación:** Provider KYC integrado. Store no puede salir de `pending_validation` sin pasar KYC. Admin ve reporte del provider.
- **Archivos afectados:** `features/store-validation/`, integración con provider.
- **Estimación:** L
- **Cuándo retomarlo:** cuando regulación local lo exija o cuando haya >10 incidentes de fraude de identidad.
- **Dependencias:** B11.2 ✅.
- **Ticket:** —
- **Notas:** Costo por check va de $1-3 — impacta modelo de negocio.

---

### NT-21 — Modelo de monetización: suscripción premium para tiendas
- **Categoría:** negocio
- **Contexto:** PRD §12.2 — suscripción con analytics avanzados, promos destacadas, prioridad en feed. Sin tocar la transacción física (se mantiene el diferencial del PRD §13).
- **Aceptación:** Planes definidos. Integración con pasarela de suscripción (Stripe / MercadoPago). UI en dashboard tienda. Feature flags por plan.
- **Archivos afectados:** mucho — schema billing, `features/billing/`, integración con F8.4 (feature flags).
- **Estimación:** XL
- **Cuándo retomarlo:** cuando se valide PMF (≥1000 tiendas activas) y haya señal de disposición a pagar.
- **Dependencias:** B14 ✅, tracción.
- **Ticket:** —
- **Notas:** Decisión sensible — validar con tiendas reales en entrevistas antes de construir.

---

### NT-22 — Predicción de demanda (ML sobre históricos)
- **Categoría:** data / ML
- **Contexto:** PRD §12.3 — ML sobre historiales para predecir zonas/horarios de alta demanda. Da valor a la tienda (dónde pararse) y potencialmente monetización (insights premium, NT-21).
- **Aceptación:** Modelo entrenado offline (ej: Python + Parquet export) que genera predicciones. UI para tienda consulta las predicciones.
- **Archivos afectados:** pipeline de ML (fuera del repo Next.js probablemente), nueva feature con consumo de predicciones.
- **Estimación:** XL
- **Cuándo retomarlo:** cuando haya >6 meses de data histórica (10k+ pedidos) — antes es señal insuficiente.
- **Dependencias:** B14 + tiempo.
- **Ticket:** —
- **Notas:** Empezar simple — avg pedidos por zona/hora/día de la semana; heurística alcanza sin ML inicialmente.

---

### NT-23 — Modo offline completo con sincronización diferida
- **Categoría:** PWA / perf
- **Contexto:** PRD §12.3 — cliente puede explorar mapa y crear pedidos offline; se sincronizan cuando hay red. Hoy el service worker (F6) cachea assets pero no hay persistencia de estado de dominio offline.
- **Aceptación:** IndexedDB como cache de stores/products. Queue de operaciones offline (submit order, accept) que se flushea al volver online. Conflict resolution definida.
- **Archivos afectados:** service worker, `shared/services/offline-queue/`, `features/map/` (data source swap), `features/order-flow/` (queue integration).
- **Estimación:** XL
- **Cuándo retomarlo:** cuando >30% de usuarios reporten problemas de conectividad (métrica de abandonos en flow).
- **Dependencias:** B6, B9 ✅.
- **Ticket:** —
- **Notas:** Problema duro — conflict resolution de mutaciones offline requiere UX cuidada (qué pasa si mientras estabas offline, la tienda se desactivó).

---

### NT-24 — App nativa iOS si la PWA topa límites
- **Categoría:** plataforma
- **Contexto:** PRD §12.3. iOS Safari tiene limitaciones duras de PWA: push requiere PWA instalada como standalone, background fetch limitado, geolocalización en background no confiable. Si esas limitaciones duelen, una app nativa iOS (Swift UI o React Native) resuelve.
- **Aceptación:** App nativa en App Store con paridad de features core. Reutiliza backend (Supabase).
- **Archivos afectados:** nuevo proyecto, probablemente monorepo (NT-11).
- **Estimación:** XL
- **Cuándo retomarlo:** cuando iOS sea >50% del uso Y las quejas de push/geoloc sean frecuentes.
- **Dependencias:** B14 ✅ + tracción iOS.
- **Ticket:** —
- **Notas:** Apple Developer account + submission + review — agregar 4-6 semanas de "Apple overhead" a la estimación real.

---

### NT-25 — Observabilidad avanzada (OpenTelemetry)
- **Categoría:** infra / obs
- **Contexto:** B12 del epic backend deja logging estructurado + Sentry + slow query alerts. Para diagnóstico de incidentes complejos (un request que atraviesa middleware → Server Action → Supabase → push worker → cron), necesitás trace distribuido — OpenTelemetry + un backend (Honeycomb, Grafana Tempo, Datadog).
- **Aceptación:** Trace end-to-end de una acción crítica (ej: submitOrder) visible en dashboard. Spans incluyen DB queries, push sends, realtime broadcasts.
- **Archivos afectados:** `instrumentation.ts` (Next.js), `shared/observability/`, env vars.
- **Estimación:** L
- **Cuándo retomarlo:** tras el primer incidente que no se haya podido diagnosticar con Sentry + logs + pg_stat_statements solos.
- **Dependencias:** B12 ✅.
- **Ticket:** —
- **Notas:** OpenTelemetry en Vercel serverless es estable desde 2024; el cliente de OTel SDK ya está maduro. Costo del backend es la variable principal.

### ~~NT-26~~ — ✅ resuelto (2026-05-06)
Mejorar mensajes de error de paridad VAPID cuando una sola clave está configurada — superRefine refactorizado con 3 ramas explícitas en `shared/config/env.schema.ts`.

### NT-27 — Mover `ALTER DATABASE SET` de seed.sql a una migración
- **Categoría:** infra / DX
- **Contexto:** `supabase/seed.sql` contiene dos `ALTER DATABASE postgres SET "app.settings.*"` agregados en B7.1. En Supabase CLI v2.95.5, el seed se aplica como el usuario `postgres` que carece del privilegio `ALTER DATABASE` (requiere superuser o `pg_alter_system`). Esto causa que `pnpm supabase:start` falle durante el seeding y deje los contenedores detenidos. Como workaround temporal en B6.1, las líneas están comentadas. Los ajustes deben vivir en una migración donde el CLI los aplica con el usuario `supabase_admin` (superuser).
- **Aceptación:** `ALTER DATABASE postgres SET "app.settings.cron_secret"` y `"app.settings.site_url"` movidos a una migración (ej: `20260428000001_schedule_crons.sql` o una nueva). `pnpm supabase:start` completa sin errores de seeding.
- **Archivos afectados:** `supabase/seed.sql`, `supabase/migrations/20260428000001_schedule_crons.sql`.
- **Estimación:** S
- **Cuándo retomarlo:** al reabrir el epic de cron jobs (B7.x) o cuando se necesite que la cron secret esté disponible en dev.
- **Dependencias:** B7.1 ✅ (bug introducido ahí).
- **Ticket:** —
- **Notas:** Descubierto en B6.1. El pgTAP test de B7.1 ya usa `set_config()` transaction-scoped como workaround correcto para tests; la migración debería hacer lo mismo para el arranque.

### NT-28 — Agregar `received_at` a la tabla `orders`
- **Categoría:** schema / backend
- **Contexto:** En B7.2, `buildOrderForTransition` usa `sent_at` como placeholder para `receivedAt` en un `OrderRecibido` porque la tabla `orders` no tiene columna `received_at`. El state machine `SISTEMA_EXPIRA` no lee `receivedAt` por ahora, pero si en el futuro `OrderExpirado` incluye `receivedAt` en el audit trail o en los domain events, la ausencia de este campo produce timestamps incorrectos silenciosamente.
- **Aceptación:** Columna `received_at timestamptz` en `orders`; migración que la rellena retrospectivamente con `updated_at` para filas en estado `recibido`/superiores; `buildOrderForTransition` en `route.ts` lee `received_at` del RPC result en vez de usar `sent_at`.
- **Archivos afectados:** `supabase/migrations/`, `app/api/cron/expire-orders/route.ts`, `supabase/migrations/20260428000004_claim_expirable_orders_rpc.sql`.
- **Estimación:** S
- **Cuándo retomarlo:** cuando `received_at` sea necesario en el audit trail del evento `ORDER_EXPIRED` o al agregar el campo a `OrderExpirado`.
- **Dependencias:** B7.2 ✅.
- **Ticket:** —
- **Notas:** Descubierto en B7.2. El comment en `route.ts:40` documenta la limitación.

---

### NT-31 — Refactorizar rutas push para usar SupabasePushSubscriptionRepository
- **Categoría:** backend / arquitectura
- **Contexto:** `app/api/push/subscribe/route.ts` y `app/api/push/unsubscribe/route.ts` llaman a `supabase.rpc("current_user_id")` y `supabase.from("push_subscriptions")` directamente, en lugar de usar `SupabasePushSubscriptionRepository`. Esto duplica la lógica de resolución de usuario y crea drift entre el `select` de la ruta (`id, endpoint, created_at, updated_at`) y el `PUSH_SELECT` del repositorio. Descubierto en revisión de B3.3.
- **Aceptación:** ambas rutas instancian `SupabasePushSubscriptionRepository`, llaman `upsertByEndpoint` (subscribe) y buscan por endpoint para luego llamar `delete(id)` (unsubscribe). Tests actualizados para reflejar la interfaz del repositorio.
- **Archivos afectados:** `app/api/push/subscribe/route.ts`, `app/api/push/subscribe/route.test.ts`, `app/api/push/unsubscribe/route.ts`, `app/api/push/unsubscribe/route.test.ts`, `shared/repositories/supabase/push-subscriptions.supabase.ts`.
- **Estimación:** S
- **Cuándo retomarlo:** cuando se toque la capa de push en cualquier otra tarea (B8.x, NT-16).
- **Dependencias:** B3.3 ✅.
- **Ticket:** —
- **Notas:** El repositorio usa `resolveUserInternalId(publicId)` mientras las rutas actuales usan `rpc("current_user_id")` — hay que alinear el mecanismo de resolución. El issue de `onConflict: "endpoint"` que no valida ownership (endpoint puede ser reasignado entre usuarios) también debe resolverse aquí.

---


### NT-29 — `resizeImageForUpload`: tipar dimensions como nullable en el no-op path

- **Categoría:** DX / types
- **Contexto:** En el path donde el MIME del archivo no es redimensionable (ej. PDF), el helper retorna `originalDimensions: { width: 0, height: 0 }` y `outputDimensions: { width: 0, height: 0 }`. Eso es ambiguo — un caller no puede distinguir "imagen de tamaño 0" (imposible en la práctica) de "nunca decodificamos el archivo". El code reviewer (B5.3, MEDIUM 2) sugirió tipar `originalDimensions` y `outputDimensions` como `ImageDimensions | null` para hacer la distinción explícita en el tipo.
- **Aceptación:** la interfaz `ResizeImageResult` expone `originalDimensions: ImageDimensions | null` y `outputDimensions: ImageDimensions | null`; los callers se actualizan; tests cubren ambos paths (`null` para MIME no redimensionable, valores reales para imágenes).
- **Archivos afectados:** `shared/utils/image-upload.ts`, `shared/utils/image-upload.test.ts`, callers en `features/catalog/components/ProductImageUpload` (creado por B10.3).
- **Estimación:** S
- **Cuándo retomarlo:** al ejecutar **B10.3** (Swap catálogo CRUD + image upload) — si el componente consumidor termina necesitando esa distinción, se hace en el mismo PR. Si no, se puede dejar como-está y descartar este item.
- **Dependencias:** B10.3 (consumer real del helper).
- **Ticket:** —
- **Notas:** descubierto por B5.3; cambio API-breaking — vale la pena agruparlo con la integración real para no tocar el helper dos veces.

### NT-44 — Documentar `SUPABASE_WEBHOOK_SECRET` en `.env.example`

- **Categoría:** DX / docs
- **Contexto:** El schema `shared/config/env.schema.ts` declara `SUPABASE_WEBHOOK_SECRET` (`z.string().min(16).optional()`), pero la variable **no aparece** en `.env.example`. Resultado: un dev que clona el repo no se entera de que existe hasta que ejecuta el código que la lee. `prod-setup.md` (B14.1) sí la documenta, pero `.env.example` es la fuente de verdad para la copia local.
- **Aceptación:** `.env.example` incluye un bloque comentado para `SUPABASE_WEBHOOK_SECRET` con instrucción de generación (`openssl rand -hex 32`) y nota de uso (Database Webhooks de Supabase → endpoints de la app).
- **Archivos afectados:** `.env.example`.
- **Estimación:** S
- **Cuándo retomarlo:** cuando se ejecute **B11-B** (audit log e2e) — ahí es cuando los Database Webhooks empiezan a usarse de verdad y el dev local va a necesitar el secret. Se puede hacer antes si surge otra tarea que toque webhooks.
- **Dependencias:** —
- **Ticket:** —
- **Notas:** descubierto por B14.1 al inventariar variables. No se arregló ahí porque el entregable de B14.1 es estrictamente `prod-setup.md`; tocar `.env.example` era scope creep.

### NT-34 — Paginación real en listado admin de usuarios

- **Categoría:** backend / perf
- **Contexto:** `SupabaseUserRepository.findAll` aplica un cap defensivo de 500 filas (`MAX_USERS_PER_QUERY`) introducido en B11-C para evitar scans no acotados en prod, pero la UI admin (`features/user-management/`) no pagina — si la base supera ese tope, el admin solo ve los primeros 500 ordenados arbitrariamente. Hay que agregar paginación real (cursor o offset/limit) tanto en repo como en hook+UI.
- **Aceptación:** `UserFilters` admite `limit` + `offset` (o `cursor`). `useUsersQuery` propaga la página y agrega `page` al query key. UI muestra controles de paginación o virtualización. El cap de 500 sigue como guardrail por `query.range()` por defecto.
- **Archivos afectados:** `shared/repositories/user.ts`, `shared/repositories/supabase/users.supabase.ts`, `shared/repositories/mock/user.mock.ts`, `features/user-management/hooks/useUsersQuery.ts`, `features/user-management/components/UserManagementPage/**`.
- **Estimación:** M
- **Cuándo retomarlo:** cuando la base real de `users` supere ~500 filas o cuando el admin reporte que no encuentra a alguien por scrolling.
- **Dependencias:** B11-C ✅.
- **Ticket:** —
- **Notas:** descubierto por B11-C (HIGH #3 del code review). El cap inline en el repo es la mitigación temporal; un `LIMIT 500` ciego no es solución a largo plazo.

---

### NT-35 — Focus trap + Escape en `SuspendConfirmDialog` y otros modales admin

- **Categoría:** a11y / UX
- **Contexto:** `SuspendConfirmDialog` (y por extensión todos los modales custom del admin que comparten patrón) usan `role="dialog"` + `aria-modal="true"` pero no atrapan el foco dentro del modal mientras está abierto, ni cierran con `Escape`. El backdrop click cancela, pero usuarios solo-teclado no pueden dismiss y los screen readers anuncian el contenido fuera del modal pese al `aria-modal`. La solución limpia es migrar el patrón de modal admin a `@radix-ui/react-dialog` (ya disponible vía shadcn).
- **Aceptación:** todos los `*ConfirmDialog` del admin usan `<Dialog>` de shadcn (Radix). Soportan focus trap, Escape para cancelar, scroll lock, y ARIA correcta automáticamente. Tests verifican focus inicial, navegación con Tab y dismiss con Escape.
- **Archivos afectados:** `features/user-management/components/SuspendConfirmDialog/**`, otros `*ConfirmDialog` en `features/store-validation/`, `features/content-moderation/`.
- **Estimación:** M
- **Cuándo retomarlo:** auditoría de a11y, integración con WCAG 2.1 AA, o feedback de usuarios con teclado/screen readers.
- **Dependencias:** B11-C ✅.
- **Ticket:** —
- **Notas:** descubierto por B11-C (MEDIUM #7 del code review). Patrón compartido entre features → vale la pena hacerlo de un solo PR cross-feature en vez de uno por modal.

### NT-39 — E2E happy path cliente (cart → submit → tracking → cancel → history)

- **Categoría:** testing / E2E
- **Contexto:** Descubierto al ejecutar **B9-B / B9-C**. El plan formal pedía 1 spec Playwright del golden path completo. Diferido por dependencias ambientales: requiere Supabase local levantado con seed completo (tienda activa + productos `available=true` para el customer fixture), VAPID keys configurados (sino el push opt-in falla en `pushManager.subscribe`), y service worker registrado vía serwist. Las suites unit/integration con mocks de repos ya cubren la lógica de submitOrder, cancelOrder y useOrderHistory; lo que falta es el wire end-to-end real.
- **Aceptación:** `e2e/orders-flow.spec.ts` con un único test que: (1) setea cookie de sesión cliente con `setSessionCookie`, (2) navega al mapa, (3) abre detalle de tienda seedada, (4) agrega 1 producto al carrito, (5) submit → redirige a `/orders/{publicId}`, (6) ve estado ENVIADO en tracking, (7) cancel → ve CANCELADO, (8) navega a history y ve el pedido como CANCELADO. CI verde.
- **Archivos afectados:** `e2e/orders-flow.spec.ts` (nuevo), `supabase/seed.sql` (agregar fixtures de tienda + productos para el cliente fixture).
- **Estimación:** M
- **Cuándo retomarlo:** al cerrar B14 (deploy producción) o cuando `pnpm supabase:reset` deje el repo con seed completo de cliente + tienda + productos.
- **Dependencias:** B14.1 (Supabase Cloud setup) + B13-B (seed data + runbooks).
- **Ticket:** —
- **Notas:** Cubierto por unit/integration: 13 tests submitOrder, 14 cancelOrder + state-machine, 7 useOrderHistory, 22 repo findByCustomer, 7 cursor encode/decode. Risk asumido: posibles regresiones de wire (RLS policies, query keys, navigations) que sólo aparecen en E2E real.

### NT-38 — Borrar `features/orders/services/orders.mock.ts` tras cierre de B10-C

- **Categoría:** refactor / cleanup
- **Contexto:** Descubierto al ejecutar **B9-B.5**. El swap de hooks cliente (`useSendOrderMutation`, `useCancelOrderMutation`, `useOrderQuery`, `useOrdersQuery` para historial) ya migró fuera de `orders.mock.ts`. Pero los hooks lado tienda (`useAcceptOrderMutation`, `useRejectOrderMutation`, `useFinalizeOrderMutation`, `useStoreOrdersQuery`) y el barrel `features/orders/services/index.ts` aún importan el mock. Se decide **defer** el borrado total a B10-C (manejo de pedidos lado tienda).
- **Aceptación:** post B10-C, hacer grep de `orders.mock` en todo el repo. Si retorna 0 imports, borrar `features/orders/services/orders.mock.ts`, `features/orders/services/orders.service.ts` (interface ya redundante post-swaps) y simplificar/borrar `features/orders/services/index.ts`. Verificar `pnpm typecheck` + suite.
- **Archivos afectados:** `features/orders/services/orders.mock.ts`, `features/orders/services/orders.service.ts`, `features/orders/services/index.ts`, todos los tests del lado tienda.
- **Estimación:** S
- **Cuándo retomarlo:** al cerrar B10-C.
- **Dependencias:** B10-C.
- **Ticket:** —
- **Notas:** Hooks lado tienda hoy usan `ordersService.{accept,reject,finalize,findByStore}` (mock). B10-C los swappea a Server Actions / repo real, eliminando la última dependencia.

---

### NT-42 — Relajar `Store` Zod schema: `photoUrl` / `tagline` / `priceFromArs` deben ser opcionales

- **Categoría:** backend / types
- **Contexto:** `shared/schemas/store.ts` define `photoUrl: z.string().url()` y `tagline: z.string()` y `priceFromArs: z.number().min(0)` como **requeridos**, pero la DB los acepta como NULL (`alter table public.stores add column ... text` sin NOT NULL en `20260428000008_store_profile_extras.sql`) y el mapper `mapStoreRow` ya tiene fallbacks: `photo_url ?? PLACEHOLDER_PHOTO_URL`, `tagline ?? ""`, `price_from_ars ?? 0`. La rigidez del schema obliga al onboarding a inventar valores placeholder antes del INSERT (B10-A.2a usa `"https://ambulante.app/placeholder-store.png"`, `tagline=businessName`, `priceFromArs=0`), y al perfil (B10-A.3) a mostrarlos al usuario hasta que los reemplace. Modela mal la realidad: una tienda recién registrada **conceptualmente** no tiene logo / tagline / precio mínimo todavía.
- **Aceptación:** `storeSchema` declara `photoUrl: z.string().url().optional()`, `tagline: z.string().optional()`, `priceFromArs: z.number().min(0).optional()`. `CreateStoreInput` los hace opcionales. `SupabaseStoreRepository.create` los inserta como NULL si vienen undefined. Mapper `mapStoreRow` mantiene los fallbacks por compat. Componentes consumidores (`StoreCard`, `StoreMarker`, etc.) tratan undefined como "sin foto/tagline/precio" en la UI (probablemente ya lo hacen vía los fallbacks del mapper). Tests de schema, repo y componentes verdes.
- **Archivos afectados:** `shared/schemas/store.ts`, `shared/repositories/store.ts` (CreateStoreInput / UpdateStoreInput), `shared/repositories/supabase/stores.supabase.ts` (create — manejar undefined), `shared/repositories/supabase/mappers.ts` (verificar fallbacks). Posibles ajustes en `features/store-profile/`, `features/map/`, `features/store-shell/`.
- **Estimación:** M
- **Cuándo retomarlo:** **junto con B10-A.3** (profile editor real). Cuando el editor exista, los placeholders pueden reemplazarse y el schema relajado representa el ciclo de vida correcto. Antes no urge porque los fallbacks del mapper enmascaran.
- **Dependencias:** —
- **Ticket:** —
- **Notas:** descubierto por B10-A.2a. Workaround actual: `submit-store-onboarding.ts` define `PENDING_STORE_PLACEHOLDER` con valores que pasan Zod. Después del fix, el placeholder se elimina y el INSERT pasa los campos como undefined.

---

### NT-40 — `SupabaseStoreRepository.create` hace 3 round-trips sin transacción ni dedup

- **Categoría:** backend / reliability
- **Contexto:** `create()` ejecuta 3 queries secuenciales: (1) SELECT `users.id` interno, (2) INSERT en `stores`, (3) SELECT desde `stores_view` para re-fetch. Si el step 3 falla (view recreada, lag temporal) la fila ya existe en DB pero la Server Action retorna `{ success: false }`. El usuario reintenta y choca contra la UNIQUE constraint de `public_id` o CUIT. El nuevo campo `cuit` (B10-A) hace este escenario más probable de ser visible al usuario. Detectado durante code review de cierre B10-A.
- **Aceptación:** Una de: (a) envolver los 3 steps en una RPC Postgres que retorne el row completo, o (b) agregar dedup en la Server Action (`checkIfStoreExists` antes de `createStore`) para idempotencia, o (c) hacer que `create()` use `RETURNING *` junto con un JOIN a `users` para eliminar el re-fetch separado.
- **Archivos afectados:** `shared/repositories/supabase/stores.supabase.ts` (`create`), `features/store-onboarding/server-actions/store-onboarding-actions.ts` (dedup guard opcional).
- **Estimación:** M
- **Cuándo retomarlo:** antes de go-live (B14) o cuando se agrege retry logic al onboarding. Hoy el riesgo es bajo porque la cadena de éxitos en un deploy fresco es casi 100%.
- **Dependencias:** —
- **Ticket:** —
- **Notas:** Pre-existente en la implementación de `create()`. Descubierto por code-reviewer durante cierre de B10-A.

### NT-43 — `fetchAuditLog` devuelve `null` tanto para "pedido sin entradas" como para errores de Supabase

- **Categoría:** backend / UX admin
- **Contexto:** `features/admin-audit-log/actions/fetch-audit-log.ts` colapsa tres salidas distintas a `null`: (a) validación de input fallida, (b) orden sin entradas en audit_log, (c) excepción de Supabase. La UI muestra "no se encontraron transiciones" en los tres casos. Para un admin investigando un incidente, un error de red o de BD se ve igual que un pedido genuinamente sin entradas. Detectado durante code review de cierre B11-B.
- **Aceptación:** El tipo de retorno de `fetchAuditLog` pasa de `AuditLogResult | null` a un tipo discriminado (`{ status: "ok", data: AuditLogResult } | { status: "not_found" } | { status: "error", message: string }`). El container/hook consumen el nuevo tipo y muestran un estado de error distinto al de "no encontrado".
- **Archivos afectados:** `features/admin-audit-log/actions/fetch-audit-log.ts`, `features/admin-audit-log/hooks/useAuditLogQuery.ts`, `features/admin-audit-log/components/OrderAuditLog/OrderAuditLog.container.tsx`, `features/admin-audit-log/types/audit-log.types.ts`.
- **Estimación:** M
- **Cuándo retomarlo:** cuando el admin reporte confusión al auditar pedidos (no sabe si el log está vacío o si hubo un error de conexión).
- **Dependencias:** B11-B ✅.
- **Ticket:** —
- **Notas:** Descubierto por code-reviewer durante cierre de B11-B.

---

## Cómo se alimenta este doc durante la ejecución del epic

Cuando un chat que toma una tarea del EPIC-BACKEND descubre algo fuera de scope:

1. **En PASO 7 del template**, agregar entrada a este doc con siguiente ID libre (`NT-NN`).
2. **Nunca** agregar al epic — el epic es MVP, este doc es post-MVP.
3. Enlazar desde las `Notas:` de la tarea origen con `(descubierto por Bx.y; ver NT-NN en NEXT-TASK.md)`.
4. Actualizar el índice al principio del doc.

---

## Changelog

| Fecha | Cambio |
|---|---|
| 2026-04-21 | Reescritura completa con formato estructurado. Poblado inicial: NT-01 a NT-25 (3 originales + 22 nuevos del brainstorming + decisiones post-MVP del PRD). |
| 2026-04-29 | NT-32 agregado — vitest 9 fails preexistentes detectados durante cierre de B14.3. |
| 2026-04-30 | NT-38 agregado — defer de borrado total `orders.mock.ts` hasta cierre de B10-C. |
| 2026-04-30 | NT-39 agregado — defer E2E happy path cliente hasta seed completo + VAPID en local. |
| 2026-04-30 | NT-40 + NT-41 + NT-42 agregados — 3-round-trips sin TX en `create()`, bug `auth.uid` vs `public_id`, rigidez de `Store` schema (todos descubiertos durante cierre de B10-A). |
| 2026-05-06 | NT-30 (timestamps duplicados) eliminado — resuelto en B12-A. NT-32 (vitest fails) eliminado — resuelto (1997 tests pasan). NT-30 (SUPABASE_WEBHOOK_SECRET) renombrado a NT-44; NT-30 (Node 24) renombrado a NT-45 — elimina colisión triple de IDs. |
| 2026-05-06 | NT-41 eliminado — resuelto (`resolvePublicId()` con cache in-memory; `toUser/toSession` ahora exponen `public.users.public_id`). |
| 2026-05-06 | NT-36 eliminado — resuelto (`scripts/check-migration-timestamps.sh` + job `check-migration-timestamps` en CI). |
| 2026-05-06 | NT-45 eliminado — resuelto. `next.config.ts` ya no importa `env.runtime` (import chain roto en refactor previo); `.nvmrc` + `engines.node` agregados para documentar Node 24 como runtime activo. |
| 2026-05-06 | NT-44 eliminado — resuelto (bloque `SUPABASE_WEBHOOK_SECRET` agregado a `.env.example` con instrucción de generación y nota de uso). |
| 2026-05-06 | NT-31 eliminado — resuelto (rutas push usan `SupabasePushSubscriptionRepository`; elimina `rpc("current_user_id")` y acceso directo a `push_subscriptions`). |
