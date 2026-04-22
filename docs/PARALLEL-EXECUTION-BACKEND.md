# Plan de ejecución paralela — Backend (Chats por fase)

> **Qué es este doc:** guía operativa por fase del epic backend. Te dice **cuántos chats abrir, qué `Task ID` pegar en cada uno y en qué momento**. Es el equivalente al [`PARALLEL-EXECUTION-PLAN.md`](./PARALLEL-EXECUTION-PLAN.md) pero para el [EPIC-BACKEND](./EPIC-BACKEND.md).
>
> **Cómo se usa:** cuando termines una fase y vayas a arrancar la siguiente, venís acá, buscás el bloque de esa fase y abrís los chats según las **waves** indicadas. Cada chat recibe el [PROMPT-TEMPLATE-BACKEND](./PROMPT-TEMPLATE-BACKEND.md) con su `Task ID` y corre en su propio `git worktree`.

---

## ⚠️ Leé esto primero — Waves ≠ lotes secuenciales

Igual que en el epic frontend: **una Wave NO es un lote que termina antes de la siguiente**. Es una **ventana de desbloqueo** — define el momento más temprano en que sus tareas pueden empezar. Las waves anteriores **siguen vivas en sus chats** mientras abrís la siguiente.

El patrón correcto:

```
✅ CORRECTO

"Wave A arranca en T0.
 Wave B arranca apenas se cumpla SU gating, aunque la
 Wave A todavía tenga chats vivos. Conviven en paralelo."
```

El error típico:

```
❌ INCORRECTO

"Termino toda la Wave A, después arranco la Wave B"
 (secuencial, como si fuera un pipeline de batch jobs)
```

Para el detalle conceptual completo, diagrama temporal, y reglas de gating, ver la sección "LEER ESTO PRIMERO" del epic frontend [`PARALLEL-EXECUTION-PLAN.md`](./PARALLEL-EXECUTION-PLAN.md). Este doc asume que ya la conocés.

---

## Glosario (mismas reglas que el frontend)

- **Wave A/B/C…** = ventana de desbloqueo dentro de una fase. Tareas de la misma wave son paralelas entre sí.
- **Gating** = condición que destraba la wave. Single-dep (`B1.1 ✅`) o convergencia (`B3.1 + B3.2 ✅`).
- **🔗 cadena** = un chat ejecuta múltiples tareas en secuencia vía `Continues with:`.
- **⚠️ conflicto** = archivo compartido con otro chat de la misma wave. Coordinar el orden de merge.
- **Worktree obligatorio** = cada chat en su `git worktree` (nunca en el principal).

---

## ⚠️ Limitación operativa — Supabase local es single-instance

Supabase CLI usa puertos fijos (54321-54324), así que **solo una instancia puede correr a la vez en tu máquina**. Eso afecta directamente el paralelismo de las fases que tocan DB (B0-B8, B11.6, B13).

**Tres estrategias para convivir con eso:**

| Estrategia | Cuándo usar | Cómo |
|---|---|---|
| **S1 — DB compartida** | Tareas que no hacen `supabase:reset` y no pisan schemas entre sí | Un solo `supabase:start` global; cada chat corre sus tests contra la misma DB |
| **S2 — Serializada** | Tareas que sí hacen `supabase:reset` o tocan schema fuerte | Cada chat levanta Supabase, corre su verificación, y la baja; turnos coordinados por el usuario |
| **S3 — Puertos custom por worktree** | Si querés verdadero paralelismo heavy-DB | Override en `supabase/config.toml` por branch. Complejo — mejor quedó en NEXT-TASK.md (NT-06 si se escala) |

**Implicancia en los números de pico concurrente de este doc:** los "6 chats simultáneos B4-B8" son **6 chats abiertos**, no 6 corriendo DB tests al mismo tiempo. Cuando les toca verificar contra DB, se serializan con S2. Si la tarea es TS puro (no toca SQL/tests DB), corren 100% en paralelo sin problema.

Regla práctica: **tareas de la misma fase que tocan DB se serializan** para el verification; tareas de fases distintas pueden correr con S1 si no tocan el mismo schema.

---

## Cómo abrir una wave

1. **Verificar el gating en el epic.** Buscás las tareas del gate en `docs/EPIC-BACKEND.md` y confirmás `✅ done`.
2. **No esperás a chats anteriores que sigan corriendo.** Solo importa el gate explícito.
3. **Crear los worktrees** desde el directorio principal:
   ```bash
   git worktree add ../ambulante-b<task-id> -b feat/b<task-id>-<slug>
   ```
4. **Abrir un chat de Claude por worktree** con `cd` al worktree antes:
   ```bash
   cd ~/Desktop/ambulante-b1-2 && claude
   ```
5. **Pegar el template** de `docs/PROMPT-TEMPLATE-BACKEND.md` con `{{TASK_IDS}}` reemplazado.
6. **No tocar chats de waves anteriores.** Terminan solos cuando completan.

---

# FASE B0 — Setup Supabase local + CLI + env + CI migraciones

**Pre-requisito:** ninguno (este epic arranca acá).
**Total de chats:** 3.
**Pico paralelo:** 3 simultáneos en Wave A.

### Wave A — arranque inicial (3 chats — T0)

**Gating:** ninguno.
**Chats vivos cuando abrís esta wave:** 0.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `B0.1` | Supabase CLI + Docker + scripts. ⚠️ modifica `package.json`. |
| 2 | `B0.2` | Env schema split pooler/direct. Solo toca `shared/config/`. |
| 3 | `B0.3` | Migration template + convention doc. Solo toca `supabase/` + `docs/workflows/`. |

> ⚠️ **Conflict en `package.json`:** chats 1 y 2 tocan `package.json` (scripts + deps). El primero que mergee entra limpio; el segundo hace `git pull --rebase` y resuelve. **Serializá el merge, no el desarrollo.**

### Wave B — se desbloquea cuando **B0.1 + B0.3** estén ✅ (1 chat)

**Gating:** `B0.1 ✅ AND B0.3 ✅` (convergencia).
**Chats anteriores que pueden seguir vivos:** Chat 2 (B0.2).

| Chat | Task ID | Notas |
|---|---|---|
| 4 | `B0.4` | CI migraciones + drift check + audit FK. Depende de `pnpm supabase:start` (B0.1) y del template (B0.3). |

**Cierre de B0:** 4 tareas ✅. Destraba B1.

---

# FASE B1 — Schema core + extensiones + índices + monitoring

**Pre-requisito:** B0 ✅ entera.
**Total de chats:** 1 (cadena C-B1-schema completa).
**Pico paralelo:** 1.

### Wave A — cadena única (1 chat — T0)

**Gating:** B0 ✅ entera (convergencia a nivel fase).

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `B1.1` | 🔗 cadena C-B1-schema: auto-continúa B1.2 → B1.3 → B1.4 → B1.5. **Es la fase más larga del epic.** Un solo chat porque cada migración depende secuencialmente de la anterior. |

**Cierre de B1:** 5 tareas ✅. Destraba B2 y B3.

---

# FASE B2 — RLS policies + tests + performance

**Pre-requisito:** B1.2 ✅ (tablas existen).
**Total de chats:** 3.
**Pico paralelo:** 3.

### Wave A — arranque (2 chats — T0)

**Gating:** `B1.2 ✅`. (No espera a B1.5; las tablas alcanzan.)
**Chats vivos cuando abrís esta wave:** si B1 no cerró completo, puede haber 1 (cadena C-B1-schema).

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `B2.1` | Policies RLS. ⚠️ Largo pero paralelizable con B2.5 y B1 tail. |
| 2 | `B2.5` | Lint SQL check. No depende de las policies terminadas — depende del patrón, que ya está definido en el epic. |

### Wave B — se desbloquea **apenas B2.1 esté ✅** (1 chat nuevo)

**Gating:** `B2.1 ✅`.
**Chats anteriores que pueden seguir vivos:** Chat 2 (B2.5).

| Chat | Task ID | Notas |
|---|---|---|
| 3 | `B2.2` | 🔗 cadena lógica: auto-continúa B2.3 → B2.4 (aunque no está formalizado como cadena en el epic, son naturales de encadenar en el mismo chat). |

**Cierre de B2:** 5 tareas ✅. Destraba fases `auth/storage/realtime/cron/push` (B4-B8) junto con B3.

---

# FASE B3 — Boundaries de portabilidad

**Pre-requisito:** B1.2 ✅, B2.1 ✅, B0.2 ✅.
**Total de chats:** 2.
**Pico paralelo:** 2.

> Esta fase **corre en paralelo con B2** idealmente. B2 instala la seguridad; B3 instala la disciplina arquitectónica. Son archivos distintos y no compiten.

### Wave A — arranque (2 chats — T0 de la fase)

**Gating:** `B1.2 ✅ AND B2.1 ✅ AND B0.2 ✅`.
**Chats vivos cuando abrís esta wave:** posibles Chats de B2 (chat 2 con B2.5, chat 3 con cadena B2.2→B2.4).

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `B3.1` | Repositories Supabase (6 archivos). L. |
| 2 | `B3.2` | Facades stubs (4 archivos). M. |

### Wave B — convergencia: se desbloquea cuando **B3.1 + B3.2** estén ✅ (1 chat)

**Gating:** `B3.1 ✅ AND B3.2 ✅` (convergencia).

| Chat | Task ID | Notas |
|---|---|---|
| 3 | `B3.3` | ESLint rule. Depende de que existan los archivos "permitidos" para marcarlos en overrides. |

### Wave C — se desbloquea **apenas B3.3 esté ✅** (1 chat)

**Gating:** `B3.3 ✅`.

| Chat | Task ID | Notas |
|---|---|---|
| 4 | `B3.4` | CI check de imports prohibidos. Refuerza la regla de ESLint. |

**Cierre de B3:** 4 tareas ✅. **⚡ Se abre el abanico B4-B8 (5 chats paralelos).**

---

# FASE B4 — Auth real (Supabase Auth + Google + magic link + middleware)

**Pre-requisito:** B3 ✅ entera (facades + lint activos).
**Total de chats:** 1 (cadena completa).
**Pico paralelo:** 1.

### Wave A — cadena única (1 chat — T0)

**Gating:** `B3 ✅` entera.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `B4.1` | 🔗 cadena C-B4-auth: auto-continúa B4.2 → B4.3 → B4.4. Un solo chat porque son 4 eslabones acoplados (config → middleware → facade → callbacks). Aprovecha contexto acumulado. |

**Cierre de B4:** 4 tareas ✅. Destraba B9 (swap cliente).

---

# FASE B5 — Storage (buckets + RLS + upload helpers)

**Pre-requisito:** B2.2 ✅ (helpers RLS) + B3.2 ✅ (facade stub).
**Total de chats:** 2.
**Pico paralelo:** 2.

### Wave A — arranque (2 chats — T0 de la fase)

**Gating:** `B2.2 ✅ AND B3.2 ✅`.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `B5.1` | Buckets + RLS de Storage. Es una migración SQL pura. |
| 2 | `B5.2` | Facade StorageService. Depende de B3.2 (stub) no de B5.1 (puede usar mock hasta que B5.1 cierre). |

### Wave B — se desbloquea **apenas B5.2 esté ✅** (2 chats)

**Gating:** `B5.2 ✅`.

| Chat | Task ID | Notas |
|---|---|---|
| 3 | `B5.3` | Upload helper con resize. Independiente de B5.4. |
| 4 | `B5.4` | Flow admin: visor de docs. Independiente de B5.3. |

**Cierre de B5:** 4 tareas ✅. Destraba B10 (swap tienda) y las partes de B9 que requieren upload.

---

# FASE B6 — Realtime wiring

**Pre-requisito:** B1.2 ✅, B2.1 ✅, B3.2 ✅.
**Total de chats:** 1 (cadena completa).
**Pico paralelo:** 1.

### Wave A — cadena única (1 chat)

**Gating:** `B3.2 ✅`.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `B6.1` | 🔗 cadena C-B6-realtime: auto-continúa B6.2 → B6.3 → B6.4. Serial natural (publication → facade → hook → reconnect). |

**Cierre de B6:** 4 tareas ✅. Destraba todas las features que consumen realtime.

---

# FASE B7 — Cron & system jobs

**Pre-requisito:** B1.1 ✅ (pg_cron habilitado), B0.2 ✅ (CRON_SECRET), B3.1 ✅ (repositories).
**Total de chats:** 1 (cadena completa para B7.1-B7.3) + paralelos al final.
**Pico paralelo:** 2.

### Wave A — cadena (1 chat)

**Gating:** `B3.1 ✅ AND B1.1 ✅`.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `B7.1` | 🔗 cadena C-B7-cron: auto-continúa B7.2 → B7.3. Cadena lógica: migración schedule → handler expire → handler auto-close. |

### Wave B — se desbloquea **apenas B7.3 esté ✅** (2 chats)

**Gating:** `B7.3 ✅`.

| Chat | Task ID | Notas |
|---|---|---|
| 2 | `B7.4` | Runbook cron. Doc only, sin deps técnicas. |
| 3 | `B7.5` | Tests concurrentes. Depende de ambos Route Handlers existentes. |

**Cierre de B7:** 5 tareas ✅.

---

# FASE B8 — Web Push delivery

**Pre-requisito:** B3.2 ✅ (push facade stub), B1.2 ✅ (tabla push_subscriptions), B2.1 ✅ (RLS de la tabla).
**Total de chats:** 1 (cadena B8.1→B8.2→B8.3) + paralelo al final.
**Pico paralelo:** 2.

### Wave A — cadena (1 chat)

**Gating:** `B3.2 ✅ AND B2.1 ✅`.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `B8.1` | 🔗 cadena C-B8-push: auto-continúa B8.2 → B8.3. |

### Wave B — se desbloquea **apenas B8.3 esté ✅** (1 chat)

**Gating:** `B8.3 ✅`.

| Chat | Task ID | Notas |
|---|---|---|
| 2 | `B8.4` | E2E del loop completo. |

**Cierre de B8:** 4 tareas ✅. Destraba push en swap de cliente (B9.8) y tienda (B10.8).

---

# Ventana B4-B8 paralela — pico de paralelismo del epic

**Cuando B3 cierra, se destraban simultáneamente:**

- B4 (1 chat, cadena auth)
- B5 (2 chats en Wave A)
- B6 (1 chat, cadena realtime)
- B7 (1 chat, cadena cron)
- B8 (1 chat, cadena push)

**Pico concurrente realista: 6 chats** en la ventana entre "B3 cerró" y "alguna de B4-B8 terminó".

Estos 5 flujos son **completamente independientes** entre sí: archivos distintos, migraciones distintas, features distintas. No hace falta coordinar merges salvo conflictos menores en `package.json` si alguno agrega deps.

---

# FASE B9 — Swap cliente

**Pre-requisito:** B4 ✅, B5 ✅, B6 ✅, B8 ✅ (facades llenos).
**Total de chats:** 6-7.
**Pico paralelo:** 5 simultáneos en Wave A.
**⚡ Corre en paralelo con B10 y B11 (trillizas — ver también F12/F13/F14 del epic frontend como espejo de este patrón).**

### Wave A — arranque (5 chats — T0 de la fase)

**Gating:** `B4 ✅ AND B5 ✅ AND B6 ✅ AND B8 ✅`.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `B9.1` | Auth swap. Primera pieza: habilita todo lo demás. |
| 2 | `B9.2` | Stores nearby + feed del mapa. Feature core del cliente. |
| 3 | `B9.3` | Store detail + products. |
| 4 | `B9.6` | Order history. Independiente de los flows de submit/tracking. |
| 5 | `B9.8` | Push subscribe + profile. |

### Wave B — se desbloquea **apenas B9.2 esté ✅** (1 chat)

**Gating:** `B9.2 ✅`. (El submit necesita que el mapa/store feed ya esté para testear E2E.)

| Chat | Task ID | Notas |
|---|---|---|
| 6 | `B9.4` | 🔗 cadena lógica: auto-continúa B9.5 → B9.7. Flow core del pedido (submit → tracking → cancel). |

**Cierre de B9:** 8 tareas ✅.

---

# FASE B10 — Swap tienda

**Pre-requisito:** B4 ✅, B5 ✅, B6 ✅, B8 ✅. (Mismo gating que B9.)
**Total de chats:** 6-7.
**Pico paralelo:** 5.
**⚡ Corre en paralelo con B9 y B11.**

### Wave A — arranque (5 chats — T0 de la fase)

**Gating:** mismo que B9.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `B10.1` | Auth + onboarding tienda. L. |
| 2 | `B10.2` | Availability toggle + location publishing. L. |
| 3 | `B10.3` | Catálogo CRUD + image upload. L. |
| 4 | `B10.4` | Inbox de pedidos + realtime. |
| 5 | `B10.8` | Push subscribe de tienda. |

### Wave B — se desbloquea **apenas B9.4 esté ✅** (1 chat)

**Gating:** `B9.4 ✅` (la transición accept/reject necesita que haya orders reales submitidas por un cliente).

| Chat | Task ID | Notas |
|---|---|---|
| 6 | `B10.5` | Accept/reject/finalize. Core del flow tienda. |

### Wave C — se desbloquea **apenas B10.3 esté ✅** (2 chats)

**Gating:** `B10.3 ✅`.

| Chat | Task ID | Notas |
|---|---|---|
| 7 | `B10.6` | Store profile + logo. Usa Storage (B5.3). |
| 8 | `B10.7` | Analytics básico. Independiente. |

**Cierre de B10:** 8 tareas ✅.

---

# FASE B11 — Swap admin

**Pre-requisito:** B4 ✅, B5 ✅, B1.2 ✅.
**Total de chats:** 4.
**Pico paralelo:** 4.
**⚡ Corre en paralelo con B9 y B10.**

### Wave A — arranque (4 chats — T0 de la fase)

**Gating:** `B4 ✅ AND B5.2 ✅`.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `B11.1` | Dashboard KPIs. |
| 2 | `B11.2` | Store validation queue. Usa B5.4. |
| 3 | `B11.3` | Content moderation. |
| 4 | `B11.6` | Audit log trigger (migración SQL — independiente). |

### Wave B — se desbloquea **apenas B11.6 esté ✅** (2 chats)

**Gating:** `B11.6 ✅`.

| Chat | Task ID | Notas |
|---|---|---|
| 5 | `B11.4` | Audit log reader. Depende de que la tabla sea append-only. |
| 6 | `B11.7` | Audit log writer en Server Actions. ⚠️ Toca features de B9 y B10 también — coordinar si alguno sigue vivo. |

### Wave C — se desbloquea **apenas B11.4 esté ✅** (1 chat)

**Gating:** `B11.4 ✅`.

| Chat | Task ID | Notas |
|---|---|---|
| 7 | `B11.5` | User management. Depende solo de repos (B3.1). |

**Cierre de B11:** 7 tareas ✅.

---

# Trillizas B9+B10+B11 — pico máximo del epic

**Cuando B4+B5+B6+B8 cierran, se destraban las trillizas:**

- B9 cliente (arranca con 5 chats paralelos)
- B10 tienda (arranca con 5 chats paralelos)
- B11 admin (arranca con 4 chats paralelos)

**Pico concurrente teórico: ~14 chats simultáneos.** Realista ~8-10 si se mantiene el ritmo humano de review.

**Regla crítica de la ventana:** ningún chat de B9/B10/B11 puede modificar archivos de `shared/` salvo que esté explícito en su campo `REGISTRY:` del epic. Todas las modificaciones al REGISTRY deben ser aditivas (no rompe a otros chats). Si hace falta modificar algo de `shared/` usado por otros, pausar y coordinar.

---

# FASE B12 — Observability backend

**Pre-requisito:** B1.1 ✅ (pg_stat_statements), B7.1 ✅ (para agregar cron de alertas).
**Total de chats:** 4.
**Pico paralelo:** 4.

### Wave A — arranque (4 chats — T0 de la fase)

**Gating:** `B1.1 ✅ AND B7.1 ✅`.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `B12.1` | Slow queries panel admin. |
| 2 | `B12.2` | Alerts a Sentry (requiere B12.1 si usa el mismo helper; se puede paralelizar si se implementa independiente). |
| 3 | `B12.3` | Structured logging server-side. Independiente. |
| 4 | `B12.4` | Supabase logs webhook → Sentry. Independiente. |

**Cierre de B12:** 4 tareas ✅.

---

# FASE B13 — Hardening

**Pre-requisito:** B3.1 ✅ (rate limit necesita repositories), B1.2 ✅ + B4.1 ✅ (seed necesita tablas + auth), B12.3 ✅ (runbooks referencian logging).
**Total de chats:** 5.
**Pico paralelo:** 4.

### Wave A — arranque (4 chats — T0 de la fase)

**Gating:** `B3.1 ✅ AND B4.1 ✅ AND B12.3 ✅`.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `B13.1` | Rate limiting in-DB. L. |
| 2 | `B13.2` | Seed data. Independiente. |
| 3 | `B13.3` | Runbook migration rollback. Doc only. |
| 4 | `B13.4` | Runbook incident response. Doc only. |

### Wave B — se desbloquea **apenas B13.1 esté ✅** (1 chat)

**Gating:** `B13.1 ✅` (security tests incluyen flood al rate limiter).

| Chat | Task ID | Notas |
|---|---|---|
| 5 | `B13.5` | Security smoke tests. |

**Cierre de B13:** 5 tareas ✅.

---

# FASE B14 — Deploy producción

**Pre-requisito:** B0 ✅, B13 ✅ (hardening cerrado).
**Total de chats:** 2-3.
**Pico paralelo:** 2.

### Wave A — arranque (2 chats)

**Gating:** `B13 ✅`.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `B14.1` | Setup Supabase Cloud + secrets. |
| 2 | `B14.3` | Release-please config. Independiente. |

### Wave B — se desbloquea **apenas B14.1 esté ✅** (1 chat)

**Gating:** `B14.1 ✅`.

| Chat | Task ID | Notas |
|---|---|---|
| 3 | `B14.2` | Pipeline CI preview → approval → prod. |

### Wave C — convergencia: se desbloquea cuando **B14.2 + B13.4** estén ✅ (1 chat)

**Gating:** `B14.2 ✅ AND B13.4 ✅`.

| Chat | Task ID | Notas |
|---|---|---|
| 4 | `B14.4` | Go-live checklist + disaster recovery. Consolida todo. |

**Cierre de B14:** 4 tareas ✅. **PROYECTO LISTO PARA PRODUCCIÓN.**

---

## Resumen ejecutivo — total de chats por fase

| Fase | Nombre | Total chats | Pico paralelo intra-fase | Gating inicial |
|---|---|---|---|---|
| B0 | Setup | 4 | 3 | ninguno |
| B1 | Schema core | 1 (cadena) | 1 | B0 ✅ |
| B2 | RLS + tests | 3 | 3 | B1.2 ✅ |
| B3 | Boundaries | 4 | 2 | B1.2, B2.1, B0.2 ✅ |
| B4 | Auth | 1 (cadena) | 1 | B3 ✅ |
| B5 | Storage | 4 | 2 | B2.2, B3.2 ✅ |
| B6 | Realtime | 1 (cadena) | 1 | B3.2 ✅ |
| B7 | Cron | 3 | 2 | B3.1, B1.1 ✅ |
| B8 | Push | 2 | 1 | B3.2, B2.1 ✅ |
| B9 | Swap cliente | 6 | 5 | B4+B5+B6+B8 ✅ |
| B10 | Swap tienda | 8 | 5 | B4+B5+B6+B8 ✅ |
| B11 | Swap admin | 7 | 4 | B4+B5+B1.2 ✅ |
| B12 | Observability | 4 | 4 | B1.1, B7.1 ✅ |
| B13 | Hardening | 5 | 4 | B3.1, B4.1, B12.3 ✅ |
| B14 | Producción | 4 | 2 | B13 ✅ |

**Total de invocaciones de chat durante todo el proyecto:** ~57.
**Pico concurrente teórico (B4+B5+B6+B7+B8):** 6 chats simultáneos.
**Pico concurrente teórico (trillizas B9+B10+B11):** ~14 chats simultáneos.
**Pico concurrente realista manteniendo calidad de review:** ~8 chats.

---

## Protocolo operativo

### Antes de abrir una wave

1. Abrir el epic y verificar que **el gating de esa wave** esté cumplido.
2. **No verificar nada más.** No importa si chats anteriores siguen vivos.
3. Verificar que las tareas no estén ya `🟡 in-progress` (race protection).
4. Crear los worktrees:
   ```bash
   git worktree add ../ambulante-b<task-id> -b feat/b<task-id>-<slug>
   ```
5. Abrir N ventanas de Claude Code, una por worktree:
   ```bash
   cd ~/Desktop/ambulante-b<task-id> && claude
   ```

### Al abrir cada chat de la wave

1. Copiar el template de `docs/PROMPT-TEMPLATE-BACKEND.md`.
2. Reemplazar `{{TASK_IDS}}` con el Task ID.
3. Pegar como primer mensaje. El PASO 0 verifica aislamiento.

### Durante la ejecución

- Cada chat reporta progreso vía `## PASO N · …`.
- Al cerrar tarea, el epic se actualiza automáticamente (PASO 7).
- Si la tarea tiene `Continues with:`, auto-claim del siguiente eslabón (PASO 8).
- **Vos abrís nuevas waves apenas su gating se cumpla.** No esperás a que los chats activos cierren.

### Al cerrar una wave

1. Verificar tareas ✅ en el epic.
2. `git pull` en el directorio principal para traer actualizaciones.
3. Limpiar worktrees:
   ```bash
   git worktree remove ../ambulante-b<task-id>
   ```
4. Si se completó la fase, pasar a la siguiente.

### Manejo de bloqueos

- Tarea `🔴 blocked` → resolver DP antes de seguir.
- Chat reporta conflicto no resuelto → pausar, investigar, resumir.
- Issue fuera de scope (ej: feature nuevo) → **parar y consultar al usuario**; agregar a NEXT-TASK.md si procede.
- Dos chats van a editar mismo archivo crítico → marcar `⚠️` en la wave y serializar merge, no desarrollo.

---

## Anti-patrones comunes (heredados del epic frontend)

| Anti-patrón | Por qué está mal | Qué hacer |
|---|---|---|
| "Espero a que Wave A entera cierre antes de abrir Wave B" | Wave B se desbloquea con su gating. Dejás tiempo sin usar. | Abrí Wave B apenas su gating se cumpla. |
| "Cierro chats de Wave A cuando abro Wave B" | Chats de cadena tienen tareas pendientes; cerrarlos rompe auto-continue. | Dejá chats vivos hasta que terminen solos. |
| "Todos los chats comparten `~/Desktop/ambulante/`" | Race condition en `.git/HEAD`. | Cada chat en su propio worktree. |
| "Salto B2.5 (lint SQL) porque es chico" | El lint previene regresiones en policies futuras. | Hacelo en la wave correcta. |
| "Mergeo B9 antes de que cierre B4" | B9 importa del facade real que B4 llena. Sin B4, es vaporware. | Respetá gating de trilliza. |

---

## Changelog

| Fecha | Cambio |
|---|---|
| 2026-04-21 | Creación del plan operativo de waves para el EPIC-BACKEND.md — 15 fases, ~57 chats totales, pico realista ~8 paralelos. |
