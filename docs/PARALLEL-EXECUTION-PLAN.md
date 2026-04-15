# Plan de ejecución paralela — Chats por fase

> **Qué es este doc:** una guía operativa que te dice, **para cada fase**, cuántos chats abrir, qué `Task ID` pegar en cada uno y en qué orden. Validado contra las dependencias y cadenas del [epic](./EPIC-ARCHITECTURE.md).
>
> **Cómo se usa:** cuando termines una fase y vayas a arrancar la siguiente, venís acá, buscás el bloque de esa fase y abrís los chats según los batches indicados. Cada chat recibe el [template](./PROMPT-TEMPLATE.md) con su `Task ID`.

---

## Leyenda

- **Batch A/B/C...** = grupo de chats que se abren al mismo tiempo (son paralelos entre sí dentro del batch).
- **Gating** = condición para abrir el siguiente batch (típicamente "cuando X esté ✅ en el epic").
- **🔗 cadena** = el chat ejecuta múltiples tareas en secuencia gracias a `Continues with:` del epic. Solo pasás el ID de la cabeza.
- **⚠️ conflicto** = archivo compartido con otro chat del mismo batch. Coordinar para evitar merge conflicts.

### Cómo "gatear" (abrir el siguiente batch)

1. Cada vez que un chat marca una tarea como ✅ en el epic, hacés `git pull` en tu copia local del epic.
2. Revisás si las tareas del siguiente batch ya están 🟢 ready (todas sus deps ✅).
3. Si están, abrís las ventanas de ese batch.

---

# FASE 0 — Dev infrastructure

**Pre-requisito:** ninguno.
**Decisiones pendientes:** ninguna.
**Total de chats:** 7.

### Batch A — arranque inicial (3 chats)

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F0.1` | 🔗 cadena C-F0-eslint: auto-continúa F0.3 → F0.4 |
| 2 | `F0.2` | standalone |
| 3 | `F0.9` | standalone |

### Batch B — gatea cuando F0.1 esté ✅ (3 chats)

> Nota: cuando F0.1 cierra, Chat 1 sigue vivo ejecutando F0.3 y F0.4 (cadena). Los chats de Batch B pueden trabajar en paralelo con Chat 1.

| Chat | Task ID | Notas |
|---|---|---|
| 4 | `F0.5` | depende de F0.1 |
| 5 | `F0.6` | depende de F0.1 |
| 6 | `F0.8` | depende de F0.1, upgrade Next 15 |

### Batch C — gatea cuando F0.3, F0.5 y F0.6 estén ✅ (1 chat)

| Chat | Task ID | Notas |
|---|---|---|
| 7 | `F0.7` | CI workflow — convergencia, necesita los 3 anteriores |

**Cierre de F0:** las 9 tareas en ✅. Proceder a F1.

---

# FASE 1 — Capas transversales

**Pre-requisito:** F0 ✅.
**Decisiones pendientes:** ninguna.
**Total de chats:** 7.
**⚡ Pico de paralelismo fundacional.**

### Batch A — arranque inicial (5 chats)

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F1.1` | 🔗 cadena C-F1-query: auto-continúa F1.2. ⚠️ edita `app/layout.tsx` |
| 2 | `F1.3` | 🔗 cadena C-F1-logger: auto-continúa F1.10 |
| 3 | `F1.4` | standalone — routes tipadas |
| 4 | `F1.6` | standalone — Zustand setup |
| 5 | `F1.8` | 🔗 cadena C-F1-design: auto-continúa F1.9. ⚠️ edita `tailwind.config.ts` |

### Batch B — gatea cuando F1.1 esté ✅ (1 chat)

> F1.7 toca `app/layout.tsx` — no se puede arrancar hasta que Chat 1 libere el archivo.

| Chat | Task ID | Notas |
|---|---|---|
| 6 | `F1.7` | nuqs provider — espera a que F1.1 haya committeado el layout |

### Batch C — gatea cuando F1.3 esté ✅ (1 chat)

> F1.5 depende de F1.3 (logger) pero no forma parte de la cadena C-F1-logger (F1.10 sí).

| Chat | Task ID | Notas |
|---|---|---|
| 7 | `F1.5` | Error boundaries — usa el logger |

**Cierre de F1:** todas las tareas ✅. Se abre el abanico: F2, F3, F6, F7, F8, F9, F10, F11 paralelizables.

---

# FASE 2 — Auth + roles + shells

**Pre-requisito:** F1 ✅, F3.1 ✅ (schemas Zod base), **DP-2 resuelta**.
**Decisiones pendientes:** DP-2 (auth provider).
**Total de chats:** 5.

### Batch A — arranque (1 chat — fase heavily serial)

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F2.1` | 🔗 cadena C-F2-core-auth: auto-continúa F2.2 → F2.3 → F2.4 |

> Este chat es **uno solo haciendo 4 tareas seriales**. Tarda lo suyo. Otros chats no pueden arrancar todavía.

### Batch B — gatea cuando F2.4 esté ✅ (4 chats)

| Chat | Task ID | Notas |
|---|---|---|
| 2 | `F2.5` | layout route group Cliente |
| 3 | `F2.6` | layout route group Tienda |
| 4 | `F2.7` | layout route group Admin |
| 5 | `F2.8` | 🔗 cadena C-F2-onboarding: auto-continúa F2.9 |

**Cierre de F2:** 9 tareas ✅. Habilita F12, F13, F14 (features por rol).

---

# FASE 3 — Domain model

**Pre-requisito:** F0 ✅.
**Decisiones pendientes:** ninguna.
**Total de chats:** 5.

### Batch A — arranque (2 chats)

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F3.1` | Schemas Zod base — bottleneck de toda F3 |
| 2 | `F3.7` | Constants del dominio — sin deps |

### Batch B — gatea cuando F3.1 esté ✅ (3 chats)

| Chat | Task ID | Notas |
|---|---|---|
| 3 | `F3.2` | 🔗 cadena C-F3-state: auto-continúa F3.5 → F3.6 |
| 4 | `F3.3` | Product snapshot |
| 5 | `F3.4` | Repository interfaces |

**Cierre de F3:** 7 tareas ✅. Habilita F4 (data layer) y F5 (realtime).

---

# FASE 4 — Data layer hardening

**Pre-requisito:** F1 ✅, F3 ✅.
**Decisiones pendientes:** ninguna.
**Total de chats:** 4.

### Batch A — arranque (3 chats)

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F4.1` | 🔗 cadena C-F4-pattern: auto-continúa F4.2 |
| 2 | `F4.3` | Zod parseResponse helper — standalone |
| 3 | `F4.4` | Retry + offline policies. ⚠️ edita `QueryProvider.tsx` |

### Batch B — gatea cuando F4.4 esté ✅ (1 chat)

> F4.5 también edita `QueryProvider.tsx`. Serializar para evitar merge conflict.

| Chat | Task ID | Notas |
|---|---|---|
| 4 | `F4.5` | Toaster + error handling estándar |

**Cierre de F4:** 5 tareas ✅.

---

# FASE 5 — Realtime infrastructure

**Pre-requisito:** F2 ✅, F3 ✅, **DP-1 resuelta**.
**Decisiones pendientes:** DP-1 (backend stack).
**Total de chats:** 4.

### Batch A — arranque (1 chat)

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F5.1` | 🔗 cadena C-F5-realtime: auto-continúa F5.2 |

### Batch B — gatea cuando F5.2 esté ✅ (2 chats)

| Chat | Task ID | Notas |
|---|---|---|
| 2 | `F5.3` | Integración con React Query |
| 3 | `F5.4` | Reconnect + backoff |

### Batch C — gatea cuando F12 y F13 estén ✅ parcialmente (1 chat)

> F5.5 es un test E2E de propagación que necesita features reales de Cliente y Tienda para disparar transiciones.

| Chat | Task ID | Notas |
|---|---|---|
| 4 | `F5.5` | Test E2E propagación <5s |

**Cierre de F5:** 5 tareas ✅.

---

# FASE 6 — PWA

**Pre-requisito:** F1 ✅, F0.8 ✅ (Next 15).
**Decisiones pendientes:** ninguna.
**Total de chats:** 5.

### Batch A — arranque (1 chat)

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F6.1` | Serwist setup — bottleneck de toda F6 |

### Batch B — gatea cuando F6.1 esté ✅ (4 chats)

| Chat | Task ID | Notas |
|---|---|---|
| 2 | `F6.2` | Estrategia offline |
| 3 | `F6.3` | Web Push (necesita F0.2 env para VAPID) |
| 4 | `F6.4` | Install prompt |
| 5 | `F6.5` | Background sync (necesita F4.2) |

**Cierre de F6:** 5 tareas ✅.

---

# FASE 7 — Testing infrastructure

**Pre-requisito:** F0.5 ✅, F1.1 ✅.
**Decisiones pendientes:** ninguna.
**Total de chats:** 6.

### Batch A — arranque (1 chat)

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F7.1` | Testing library setup — bottleneck |

### Batch B — gatea cuando F7.1 esté ✅ (4 chats)

| Chat | Task ID | Notas |
|---|---|---|
| 2 | `F7.2` | Factories y fixtures (necesita F3.1) |
| 3 | `F7.3` | Tests de state machine (necesita F3.2) |
| 4 | `F7.4` | Tests de hooks críticos |
| 5 | `F7.6` | Coverage en CI con umbral |

### Batch C — gatea cuando F7.2 esté ✅ (1 chat)

| Chat | Task ID | Notas |
|---|---|---|
| 6 | `F7.5` | Component tests (smart vs dumb) |

**Cierre de F7:** 6 tareas ✅ (F7.7 queda deferred).

---

# FASE 8 — Observability

**Pre-requisito:** F1.3 ✅, F3.2 ✅, **DP-3 y DP-4 resueltas**.
**Decisiones pendientes:** DP-3 (observability stack), DP-4 (feature flags).
**Total de chats:** 5.

### Batch A — arranque (4 chats)

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F8.1` | Sentry setup |
| 2 | `F8.2` | Analytics de producto |
| 3 | `F8.4` | Feature flags |
| 4 | `F8.5` | Structured logging server-side |

### Batch B — gatea cuando F8.2 esté ✅ (1 chat)

| Chat | Task ID | Notas |
|---|---|---|
| 5 | `F8.3` | KPI instrumentation |

**Cierre de F8:** 5 tareas ✅.

---

# FASE 9 — Design system

**Pre-requisito:** F1.8 ✅, F0.6 ✅.
**Decisiones pendientes:** ninguna.
**Total de chats:** 6.

### Batch A — arranque (6 chats paralelos)

> ⚠️ F9.1 y F9.4 ambos tocan `tailwind.config.ts`. Serializar entre sí o poner a un mismo chat.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F9.1` | Escala spacing en Tailwind. ⚠️ `tailwind.config.ts` |
| 2 | `F9.2` | Tipografía sistematizada |
| 3 | `F9.3` | Icon system |
| 4 | `F9.4` | Motion primitives. ⚠️ `tailwind.config.ts` (coordinar con Chat 1) |
| 5 | `F9.6` | Dark mode audit |
| 6 | `F9.7` | Contrast audit |

**Cierre de F9:** 6 tareas ✅ (F9.5 Storybook queda deferred).

---

# FASE 10 — i18n + a11y

**Pre-requisito:** F0.6 ✅, **DP-7 resuelta**.
**Decisiones pendientes:** DP-7 (multi-país).
**Total de chats:** 4.

### Batch A — arranque (2 chats)

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F10.1` | next-intl setup |
| 2 | `F10.3` | ARIA audit |

### Batch B — gatea cuando F10.1 y F10.3 estén ✅ (2 chats)

| Chat | Task ID | Notas |
|---|---|---|
| 3 | `F10.2` | Migrar copy a messages |
| 4 | `F10.4` | Keyboard navigation |

**Cierre de F10:** 4 tareas ✅.

---

# FASE 11 — Mapa real

**Pre-requisito:** F0.2 ✅, **DP-5 resuelta**.
**Decisiones pendientes:** DP-5 (tile provider).
**Total de chats:** 6 (fase muy serial).

### Batch A (1 chat)

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F11.1` | Decisión tile provider |

### Batch B — gatea F11.1 ✅ (1 chat)

| Chat | Task ID | Notas |
|---|---|---|
| 2 | `F11.2` | Install react-map-gl + MapLibre |

### Batch C — gatea F11.2 ✅ (1 chat)

| Chat | Task ID | Notas |
|---|---|---|
| 3 | `F11.3` | Reemplazar MapCanvas placeholder |

### Batch D — gatea F11.3 ✅ (2 chats)

| Chat | Task ID | Notas |
|---|---|---|
| 4 | `F11.4` | Clustering |
| 5 | `F11.5` | User location tracking |

### Batch E — gatea F11.4 ✅ (1 chat)

| Chat | Task ID | Notas |
|---|---|---|
| 6 | `F11.6` | Performance pass mobile |

**Cierre de F11:** 6 tareas ✅.

---

# FASE 12 — Features Cliente

**Pre-requisito:** F2 ✅, F3 ✅, F4 ✅, F5.3 ✅.
**Decisiones pendientes:** ninguna.
**Total de chats:** 6.
**⚡ Corre en paralelo con F13 y F14 (trillizas).**

### Batch A — arranque (6 chats paralelos)

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F12.1` | Store detail bottom sheet |
| 2 | `F12.2` | Cart client state |
| 3 | `F12.3` | 🔗 cadena C-F12-order: auto-continúa F12.4 |
| 4 | `F12.5` | Order history |
| 5 | `F12.6` | Cancel flow |
| 6 | `F12.7` | Profile + preferences |

**Cierre de F12:** 7 tareas ✅.

---

# FASE 13 — Features Tienda

**Pre-requisito:** F2 ✅, F3 ✅, F4 ✅, F5.3 ✅.
**Decisiones pendientes:** ninguna.
**Total de chats:** 7.
**⚡ Corre en paralelo con F12 y F14 (trillizas).**

### Batch A — arranque (6 chats)

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F13.1` | Dashboard home |
| 2 | `F13.2` | Availability toggle + location publishing |
| 3 | `F13.3` | Catálogo CRUD |
| 4 | `F13.4` | Incoming orders inbox |
| 5 | `F13.5` | Accept/reject/finalize flow |
| 6 | `F13.6` | Store profile management |

### Batch B — gatea cuando F8.3 esté ✅ (1 chat)

| Chat | Task ID | Notas |
|---|---|---|
| 7 | `F13.7` | Analytics básico (depende de KPI instrumentation) |

**Cierre de F13:** 7 tareas ✅.

---

# FASE 14 — Features Admin

**Pre-requisito:** F2 ✅, F3 ✅, F4 ✅, F8.3 ✅.
**Decisiones pendientes:** ninguna.
**Total de chats:** 5.
**⚡ Corre en paralelo con F12 y F13 (trillizas). Máxima paralelización interna.**

### Batch A — arranque (5 chats simultáneos)

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F14.1` | Dashboard KPIs |
| 2 | `F14.2` | Store validation queue |
| 3 | `F14.3` | Content moderation |
| 4 | `F14.4` | Order audit log |
| 5 | `F14.5` | User management |

**Cierre de F14:** 5 tareas ✅. **Si las trillizas se ejecutan simultáneas, el pico teórico de chats concurrentes es ~18** (6 + 7 + 5).

---

# FASE 15 — Performance y escalabilidad

**Pre-requisito:** F4 ✅, F8.4 ✅, F0.7 ✅.
**Decisiones pendientes:** DP-1 (para F15.5).
**Total de chats:** 6.

### Batch A — arranque (5 chats)

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F15.1` | Bundle analysis |
| 2 | `F15.2` | RSC boundaries review |
| 3 | `F15.3` | Image optimization |
| 4 | `F15.4` | Edge caching strategy |
| 5 | `F15.5` | Database query optimization |

### Batch B — gatea F15.5 ✅ (1 chat)

| Chat | Task ID | Notas |
|---|---|---|
| 6 | `F15.6` | Load testing |

**Cierre de F15:** 6 tareas ✅.

---

# FASE 16 — Seguridad y compliance

**Pre-requisito:** F2 ✅, F3 ✅.
**Decisiones pendientes:** DP-7 (para F16.7).
**Total de chats:** 7.

### Batch A — arranque (6 chats)

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F16.1` | Rate limiting |
| 2 | `F16.2` | Audit log inmutable (necesita F3.2) |
| 3 | `F16.3` | Privacy policy + terms |
| 4 | `F16.4` | Privacidad ubicación (necesita F12.4, F13.4) |
| 5 | `F16.5` | Secret rotation runbook |
| 6 | `F16.6` | Dependabot + pnpm audit |

### Batch B — gatea DP-7 resuelta (1 chat)

| Chat | Task ID | Notas |
|---|---|---|
| 7 | `F16.7` | GDPR/LGPD readiness |

**Cierre de F16:** 7 tareas ✅.

---

# FASE 17 — DevEx y docs

**Pre-requisito:** F0 ✅.
**Decisiones pendientes:** DP-8 (para F17.5).
**Total de chats:** 5.

### Batch A — arranque (4 chats)

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F17.1` | Contributing guide |
| 2 | `F17.2` | ADRs + primeros registros |
| 3 | `F17.3` | Onboarding doc |
| 4 | `F17.4` | Changelog automatizado |

### Batch B — gatea DP-8 resuelta, solo si DP-8 = sí (1 chat)

| Chat | Task ID | Notas |
|---|---|---|
| 5 | `F17.5` | Monorepo evaluation + migration |

**Cierre de F17:** 4-5 tareas ✅ según DP-8.

---

# FASE 18 — Producción

**Pre-requisito:** F8 ✅, F16 ✅.
**Decisiones pendientes:** DP-1 (para F18.6).
**Total de chats:** 6.

### Batch A — arranque (4 chats)

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F18.1` | Multi-environment config |
| 2 | `F18.2` | Vercel deployment config |
| 3 | `F18.5` | Runbooks de incidentes |
| 4 | `F18.6` | Disaster recovery |

### Batch B — gatea F18.1, F18.2 ✅ (1 chat)

| Chat | Task ID | Notas |
|---|---|---|
| 5 | `F18.3` | Monitoring dashboards |

### Batch C — gatea F18.3 ✅ (1 chat)

| Chat | Task ID | Notas |
|---|---|---|
| 6 | `F18.4` | Alerting rules |

**Cierre de F18:** 6 tareas ✅. **PROYECTO LISTO PARA PRODUCCIÓN.**

---

## Resumen ejecutivo — total de chats por fase

| Fase | Nombre | Total chats | Gating inicial |
|---|---|---|---|
| F0 | Dev infrastructure | 7 | ninguno |
| F1 | Capas transversales | 7 | F0 ✅ |
| F2 | Auth + roles | 5 | F1 ✅ + F3.1 + DP-2 |
| F3 | Domain model | 5 | F0 ✅ |
| F4 | Data layer | 4 | F1 + F3 ✅ |
| F5 | Realtime | 4 | F2 + F3 ✅ + DP-1 |
| F6 | PWA | 5 | F1 + F0.8 ✅ |
| F7 | Testing | 6 | F0.5 + F1.1 ✅ |
| F8 | Observability | 5 | F1.3 + F3.2 + DP-3/4 |
| F9 | Design system | 6 | F1.8 ✅ |
| F10 | i18n + a11y | 4 | F0.6 + DP-7 |
| F11 | Mapa real | 6 | F0.2 + DP-5 |
| F12 | Features Cliente | 6 | F2+F3+F4+F5.3 ✅ |
| F13 | Features Tienda | 7 | F2+F3+F4+F5.3 ✅ |
| F14 | Features Admin | 5 | F2+F3+F4+F8.3 ✅ |
| F15 | Performance | 6 | F4+F8.4+F0.7 ✅ |
| F16 | Security | 7 | F2+F3 ✅ |
| F17 | DevEx + docs | 5 | F0 ✅ |
| F18 | Producción | 6 | F8+F16 ✅ |

**Total de invocaciones de chat durante todo el proyecto:** ~106.
**Pico concurrente teórico (F12+F13+F14 trillizas):** ~18 chats simultáneos.
**Pico concurrente realista (F6+F7+F8+F9+F10+F11 ventana paralela):** ~25+ chats si se quiere acelerar al máximo.

---

## Protocolo operativo

### Antes de abrir un batch

1. Abrir el epic y verificar que todas las dependencias del batch estén `✅ done`.
2. Verificar que no haya tareas `🟡 in-progress` tomadas por otro chat que interfieran.
3. Preparar N ventanas de Claude Code (una por chat del batch).

### Al abrir cada chat del batch

1. Copiar el template de `docs/PROMPT-TEMPLATE.md` (sección "## TEMPLATE — copiar desde acá").
2. Reemplazar `{{TASK_IDS}}` con el Task ID de esa fila del batch.
3. Pegar como primer mensaje del chat.

### Durante la ejecución

- Cada chat reporta su progreso vía los separadores `## PASO N ·`.
- Al cerrar una tarea, el epic se actualiza automáticamente (PASO 7 del template).
- Si la tarea tiene `Continues with:`, el chat auto-claim el siguiente eslabón y sigue (PASO 8).

### Al cerrar un batch

1. Verificar en el epic que todas las tareas del batch estén `✅ done`.
2. Hacer `git pull` para traer las actualizaciones de otros chats.
3. Revisar si se destrabaron nuevas tareas → abrir el siguiente batch.
4. Si se completó toda la fase, pasar a la siguiente fase de este doc.

### Manejo de bloqueos

- Si una tarea aparece `🔴 blocked` por una decisión pendiente (DP-X) → resolver la decisión antes de seguir.
- Si un chat reporta un conflicto no resuelto → pausar ese chat, investigar, resolver, resumir.
- Si un chat detecta un issue fuera de scope (ej. pagos en una tarea del §5) → **parar y preguntar**, nunca seguir sin confirmación.

---

## Changelog

| Fecha | Cambio |
|---|---|
| 2026-04-15 | Creación del plan operativo con batches por fase validados contra dependencias del epic |
