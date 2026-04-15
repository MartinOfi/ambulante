# Plan de ejecución paralela — Chats por fase

> **Qué es este doc:** una guía operativa que te dice, **para cada fase**, cuántos chats abrir, qué `Task ID` pegar en cada uno y en qué momento. Validado contra las dependencias y cadenas del [epic](./EPIC-ARCHITECTURE.md).
>
> **Cómo se usa:** cuando termines una fase y vayas a arrancar la siguiente, venís acá, buscás el bloque de esa fase y abrís los chats según las **waves** indicadas. Cada chat recibe el [template](./PROMPT-TEMPLATE.md) con su `Task ID` y corre en su propio `git worktree`.

---

## ⚠️ LEER ESTO PRIMERO — Qué es una "Wave" y qué NO es

**Una Wave NO es un lote secuencial.** Es una **ventana de desbloqueo**: define el momento más temprano en que sus tareas pueden empezar a ejecutarse. Las waves anteriores **siguen vivas en sus chats** mientras vos abrís la siguiente.

### El error típico (anti-patrón)

```
❌ INCORRECTO

"Termino toda la Wave A, después arranco la Wave B,
 después la Wave C..."

(secuencial, como si fuera un pipeline de batch jobs)
```

### La interpretación correcta

```
✅ CORRECTO

"Wave A arranca en T0.
 Wave B arranca apenas se cumpla SU gating, aunque la
 Wave A todavía tenga chats vivos. Conviven en paralelo.
 Wave C ídem."

(las waves se SUMAN, no se reemplazan)
```

### Diagrama temporal — Fase 0 ejecutada bien

Ejemplo concreto con F0 (la fase que tenés delante). Las barras son chats vivos. El eje horizontal es tiempo. Notá cómo los chats de waves distintas se **superponen**:

```
tiempo →

Wave A (arranque T0)
├─ Chat 1 ════════════════════ F0.1 → F0.3 → F0.4 ═══════════════╗
├─ Chat 2 ════════ F0.2 ═══╗                                     ║
└─ Chat 3 ════ F0.9 ═╗     ║                                     ║
                     ║     ║                                     ║
Wave B (se desbloquea apenas F0.1 ✅, NO espera a F0.3/F0.4)     ║
├─ Chat 4               ════════════ F0.5 ════════╗              ║
├─ Chat 5               ════════════ F0.6 ════════╣              ║
└─ Chat 6               ════════════ F0.8 ══════════════╗        ║
                                                  ║     ║        ║
                                                  ║     ║        ║
Wave C (convergencia: necesita F0.3 + F0.5 + F0.6, ESA SÍ espera)║
└─ Chat 7                                              ════ F0.7 ═╝

T0 ───────────► T1 ──────────► T2 ─────────► T3 ──────────► T_fin
       │             │              │              │
       │             │              │              └─ F0.4 cierra (último de la cadena)
       │             │              └─ F0.5 y F0.6 cierran
       │             └─ F0.1 cierra (gate de Wave B)
       └─ Wave A completa arranca
```

**Lecturas clave del diagrama:**

1. En la ventana entre T1 y T2, hay **4 chats simultáneos**: el chat 1 sigue corriendo la cadena F0.3→F0.4, mientras los chats 4, 5 y 6 (Wave B) recién arrancaron. Los chats 2 y 3 ya cerraron pero eso no importa — los nuevos no esperaron a "Wave A entera".
2. Wave B se desbloquea con **un solo gate** (F0.1 ✅). Apenas eso pasa, abrís los 3 chats. No esperás al resto de Wave A.
3. Wave C es **distinta**: es una **convergencia** — necesita que F0.3 **Y** F0.5 **Y** F0.6 estén ✅. Esa sí espera (porque su tarea, F0.7, es un CI workflow que ejecuta los 3). Está marcada como tal en su tabla.

### Regla explícita

| Tipo de gating | Cómo se interpreta | Ejemplo |
|---|---|---|
| "Se desbloquea cuando **F0.1** esté ✅" | Apenas F0.1 cierre, abrís la wave. **No esperás al resto de los chats activos.** Las waves anteriores siguen vivas. | Wave B de F0 |
| "Se desbloquea cuando **F0.3 + F0.5 + F0.6** estén ✅" (3 deps) | Esa sí es una convergencia: necesita los 3. Esperás a los 3, después abrís. **El gating múltiple se llama explícitamente "convergencia".** | Wave C de F0 (F0.7) |
| "Se desbloquea cuando la fase X esté ✅" (toda una fase previa) | Convergencia a nivel fase. Esperás a que la fase previa cierre entera. | F1 espera F0; F2 espera F1 |

**En cada wave de cada fase de este doc, vas a ver explícitamente qué tipo de gating tiene y qué chats anteriores siguen vivos cuando la abrís.**

---

## Glosario

- **Wave A/B/C…** = ventana de desbloqueo dentro de una fase. Las tareas dentro de una wave son paralelas entre sí. Las tareas de waves distintas también pueden ser paralelas si el gating se cumple, aunque los chats anteriores sigan vivos.
- **Gating** = condición que destraba la wave. Puede ser **single-dep** ("F0.1 ✅") o **convergencia** ("F0.3 + F0.5 + F0.6 ✅").
- **🔗 cadena** = el chat ejecuta múltiples tareas en secuencia automáticamente, gracias a `Continues with:` del epic. Solo pasás el ID de la cabeza de cadena, el chat mismo claimea los siguientes eslabones. Mientras la cadena corre, ese chat está vivo y ocupa un worktree.
- **⚠️ conflicto** = archivo compartido con otro chat de la misma wave. Coordinar el orden de merge para evitar conflicts.
- **Convergencia** = wave cuyo gating son **2+ tareas a la vez**. Sí espera a todas. Marcado explícitamente.
- **Worktree obligatorio** = cada chat corre en su propio `git worktree` (no en el directorio principal). Ver `docs/PROMPT-TEMPLATE.md` PASO 0 y la sección "Reglas de seguridad" del epic.

---

## Cómo abrir una wave

1. **Verificar el gating en el epic.** Buscás las tareas listadas en el gate y confirmás que estén `✅ done` en `docs/EPIC-ARCHITECTURE.md`.
2. **No esperás a chats anteriores que sigan corriendo.** Los chats vivos de waves previas son irrelevantes para abrir esta wave — solo importa el gate explícito.
3. **Crear los worktrees de la wave** desde el directorio principal:
   ```bash
   git worktree add ../ambulante-<task-id> -b feat/<task-id>-<slug>
   ```
4. **Abrir un chat de Claude por worktree**, con `cd` al worktree antes de lanzar:
   ```bash
   cd ~/Desktop/ambulante-<task-id> && claude
   ```
5. **Pegar el template** de `docs/PROMPT-TEMPLATE.md` con `{{TASK_IDS}}` reemplazado por el Task ID de esa fila de la wave.
6. **No tocar los chats de waves anteriores.** Ellos terminan solos cuando completan su tarea o cadena.

---

# FASE 0 — Dev infrastructure

**Pre-requisito:** ninguno.
**Decisiones pendientes:** ninguna.
**Total de chats:** 7.
**Pico paralelo:** hasta **4 chats simultáneos** (la cadena F0.3→F0.4 + los 3 standalones de Wave B).

### Wave A — arranque inicial (3 chats — T0)

**Gating:** ninguno, arranca en T0.
**Chats vivos cuando abrís esta wave:** 0.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F0.1` | 🔗 cadena C-F0-eslint: auto-continúa F0.3 → F0.4. Modifica `package.json`/`pnpm-lock.yaml`. |
| 2 | `F0.2` | standalone — Zod env vars. Modifica `next.config.mjs`, crea `shared/config/`. |
| 3 | `F0.9` | standalone — CODEOWNERS + PR template. Solo `.github/`. |

### Wave B — se desbloquea **apenas F0.1 esté ✅** (3 chats nuevos)

> **🔁 IMPORTANTE — leé esto antes de pensar "espero más":**
> Esta wave se desbloquea con **un solo gate: F0.1 ✅**. Eso es todo. **No esperás a F0.3, no esperás a F0.4, no esperás a F0.2 ni F0.9.**
>
> Cuando F0.1 cierra, el Chat 1 sigue vivo ejecutando la cadena F0.3 → F0.4 en su mismo worktree. Los chats 2 y 3 (F0.2, F0.9) pueden seguir corriendo o ya haber cerrado — da igual. Vos abrís los 3 chats nuevos de Wave B (4, 5, 6) y conviven con todo lo que esté vivo.
>
> Resultado en este momento: **hasta 4 chats laburando F0 al mismo tiempo** (Chat 1 cadena + Chat 4 + Chat 5 + Chat 6). Si F0.2 o F0.9 también siguen vivos, son 5 o 6.

**Gating:** `F0.1 ✅` (single-dep).
**Chats anteriores que pueden seguir vivos:** Chat 1 (cadena F0.3→F0.4), Chat 2 (F0.2), Chat 3 (F0.9).

| Chat | Task ID | Notas |
|---|---|---|
| 4 | `F0.5` | depende solo de F0.1 — Vitest config + sanity test. Modifica `package.json`. |
| 5 | `F0.6` | depende solo de F0.1 — Playwright config + smoke test. Modifica `package.json`. |
| 6 | `F0.8` | depende solo de F0.1 — Upgrade Next 15. Modifica `package.json`. |

> ⚠️ **Conflictos de `package.json` en Wave B:** los chats 4, 5, 6 y la cadena F0.3→F0.4 (Chat 1) tocan todos `package.json` para agregar devDeps. Cuando vayan a mergear a `main`, el primero entra limpio y los siguientes hacen `git pull --rebase` y resuelven los conflicts (suelen ser triviales — líneas distintas en `devDependencies`). **Serializá los merges, no los desarrollos.**

### Wave C — convergencia: se desbloquea cuando **F0.3 + F0.5 + F0.6** estén ✅ (1 chat de cierre)

> **Esta SÍ espera.** Es una convergencia real: F0.7 (CI workflow) ejecuta `pnpm lint`, `pnpm test` y `pnpm test:e2e`, así que necesita ESLint (F0.3), Vitest (F0.5) y Playwright (F0.6) los tres en su lugar. Si abrís F0.7 antes, el workflow de CI se va a romper por falta de las tools.
>
> Notá que F0.7 **no espera a F0.4 ni a F0.8**: husky es local del developer (no del CI) y Next 15 no afecta la sintaxis del workflow.

**Gating:** `F0.3 ✅ AND F0.5 ✅ AND F0.6 ✅` (convergencia).
**Chats anteriores que pueden seguir vivos:** la cadena F0.3→F0.4 si F0.4 todavía no cerró; F0.8 si todavía está corriendo.

| Chat | Task ID | Notas |
|---|---|---|
| 7 | `F0.7` | CI workflow — convergencia, necesita los 3 anteriores. Crea `.github/workflows/ci.yml`. |

**Cierre de F0:** las 9 tareas en ✅. Proceder a F1.

---

# FASE 1 — Capas transversales

**Pre-requisito:** F0 ✅ entera.
**Decisiones pendientes:** ninguna.
**Total de chats:** 7.
**⚡ Pico de paralelismo fundacional (5 chats simultáneos en Wave A).**

### Wave A — arranque inicial (5 chats — T0)

**Gating:** F0 ✅ entera (convergencia a nivel fase).
**Chats vivos cuando abrís esta wave:** 0.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F1.1` | 🔗 cadena C-F1-query: auto-continúa F1.2. ⚠️ edita `app/layout.tsx`. |
| 2 | `F1.3` | 🔗 cadena C-F1-logger: auto-continúa F1.10. |
| 3 | `F1.4` | standalone — routes tipadas. |
| 4 | `F1.6` | standalone — Zustand setup. |
| 5 | `F1.8` | 🔗 cadena C-F1-design: auto-continúa F1.9. ⚠️ edita `tailwind.config.ts`. |

### Wave B — se desbloquea **apenas F1.1 esté ✅** (1 chat nuevo)

> F1.7 toca `app/layout.tsx`, mismo archivo que F1.1. Por eso espera a F1.1 (no a la cadena entera C-F1-query) — necesita que F1.1 ya haya commiteado el layout para no chocar.
>
> **Cuando abrís este chat, las cadenas C-F1-query (Chat 1 ya en F1.2), C-F1-logger (Chat 2) y C-F1-design (Chat 5), más los standalone Chat 3 y Chat 4, pueden seguir corriendo en paralelo.** No esperás al resto.

**Gating:** `F1.1 ✅` (single-dep).
**Chats anteriores que pueden seguir vivos:** Chat 1 (ahora en F1.2), Chat 2 (cadena logger), Chat 3, Chat 4, Chat 5 (cadena design).

| Chat | Task ID | Notas |
|---|---|---|
| 6 | `F1.7` | nuqs provider — espera a que F1.1 haya commiteado el layout. |

### Wave C — se desbloquea **apenas F1.3 esté ✅** (1 chat nuevo)

> F1.5 (error boundaries) usa el logger (F1.3). No es parte de la cadena C-F1-logger porque F1.10 (Sentry stub) sí lo es y F1.5 no.
>
> Independiente de Wave B: si F1.3 cierra antes que F1.1, podés abrir Wave C antes que Wave B. El orden alfabético de las waves es expositivo, no temporal.

**Gating:** `F1.3 ✅` (single-dep).
**Chats anteriores que pueden seguir vivos:** cualquier combinación de los chats de Wave A o Wave B que sigan corriendo.

| Chat | Task ID | Notas |
|---|---|---|
| 7 | `F1.5` | Error boundaries — usa el logger. |

**Cierre de F1:** todas las tareas ✅. Se abre el abanico: F2, F3, F6, F7, F8, F9, F10, F11 paralelizables.

---

# FASE 2 — Auth + roles + shells

**Pre-requisito:** F1 ✅ entera, F3.1 ✅ (schemas Zod base), **DP-2 resuelta** (auth provider).
**Decisiones pendientes:** DP-2.
**Total de chats:** 5.
**⚠️ Fase heavily serial al inicio.** La cadena C-F2-core-auth (4 eslabones en serie) ocupa al primer chat por bastante tiempo.

### Wave A — arranque (1 chat — T0)

> **Esta wave tiene 1 solo chat.** No es por preferencia — es porque las tareas F2.1 → F2.2 → F2.3 → F2.4 son **dependientes en serie**: el provider habilita el modelo, el modelo habilita el service, el service habilita el middleware. Físicamente no se pueden paralelizar dentro de F2 hasta que F2.4 cierre.

**Gating:** F1 ✅ + F3.1 ✅ + DP-2 resuelta.
**Chats vivos cuando abrís esta wave:** 0.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F2.1` | 🔗 cadena C-F2-core-auth: auto-continúa F2.2 → F2.3 → F2.4. **Tarda lo suyo** (4 eslabones seriales). |

### Wave B — se desbloquea **apenas F2.4 esté ✅** (4 chats nuevos)

> Apenas la cadena C-F2-core-auth llega a F2.4 (último eslabón de la serie crítica), se destraban los layouts por rol y el onboarding. **El Chat 1 puede seguir vivo si la cadena no cerró del todo** — pero F2.4 ✅ alcanza para abrir la Wave B.
>
> Estos 4 chats pueden ir todos en paralelo entre sí: cada uno toca un route group distinto (`(client)`, `(store)`, `(admin)`) o flujo distinto (login/onboarding).

**Gating:** `F2.4 ✅` (single-dep).
**Chats anteriores que pueden seguir vivos:** Chat 1 si todavía no cerró F2.4.

| Chat | Task ID | Notas |
|---|---|---|
| 2 | `F2.5` | layout route group Cliente. |
| 3 | `F2.6` | layout route group Tienda. |
| 4 | `F2.7` | layout route group Admin. |
| 5 | `F2.8` | 🔗 cadena C-F2-onboarding: auto-continúa F2.9. |

**Cierre de F2:** 9 tareas ✅. Habilita F12, F13, F14 (features por rol).

---

# FASE 3 — Domain model

**Pre-requisito:** F0 ✅ entera.
**Decisiones pendientes:** ninguna.
**Total de chats:** 5.

### Wave A — arranque (2 chats — T0)

**Gating:** F0 ✅ entera.
**Chats vivos cuando abrís esta wave:** 0.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F3.1` | Schemas Zod base — bottleneck de toda F3. |
| 2 | `F3.7` | Constants del dominio — sin deps. |

### Wave B — se desbloquea **apenas F3.1 esté ✅** (3 chats nuevos)

> F3.7 (Chat 2) puede seguir vivo o haber cerrado — irrelevante para abrir esta wave. Solo importa F3.1.

**Gating:** `F3.1 ✅` (single-dep).
**Chats anteriores que pueden seguir vivos:** Chat 2 (F3.7) si todavía no cerró.

| Chat | Task ID | Notas |
|---|---|---|
| 3 | `F3.2` | 🔗 cadena C-F3-state: auto-continúa F3.5 → F3.6. |
| 4 | `F3.3` | Product snapshot. |
| 5 | `F3.4` | Repository interfaces. |

**Cierre de F3:** 7 tareas ✅. Habilita F4 (data layer) y F5 (realtime).

---

# FASE 4 — Data layer hardening

**Pre-requisito:** F1 ✅, F3 ✅.
**Decisiones pendientes:** ninguna.
**Total de chats:** 4.

### Wave A — arranque (3 chats — T0)

**Gating:** F1 ✅ + F3 ✅.
**Chats vivos cuando abrís esta wave:** 0.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F4.1` | 🔗 cadena C-F4-pattern: auto-continúa F4.2. |
| 2 | `F4.3` | Zod parseResponse helper — standalone. |
| 3 | `F4.4` | Retry + offline policies. ⚠️ edita `QueryProvider.tsx`. |

### Wave B — se desbloquea **apenas F4.4 esté ✅** (1 chat nuevo)

> F4.5 también edita `QueryProvider.tsx`, mismo archivo que F4.4. **Por eso esperamos a F4.4 específicamente** (no a toda Wave A) — para evitar dos chats tocando el mismo archivo en paralelo.
>
> Las cadenas C-F4-pattern (Chat 1) y F4.3 (Chat 2) pueden seguir vivas o haber cerrado, no influye.

**Gating:** `F4.4 ✅` (single-dep, motivada por conflict de archivo).
**Chats anteriores que pueden seguir vivos:** Chat 1 (cadena F4.1→F4.2), Chat 2 (F4.3).

| Chat | Task ID | Notas |
|---|---|---|
| 4 | `F4.5` | Toaster + error handling estándar. |

**Cierre de F4:** 5 tareas ✅.

---

# FASE 5 — Realtime infrastructure

**Pre-requisito:** F2 ✅, F3 ✅, **DP-1 resuelta** (backend stack).
**Decisiones pendientes:** DP-1.
**Total de chats:** 4.

### Wave A — arranque (1 chat — T0)

**Gating:** F2 ✅ + F3 ✅ + DP-1 resuelta.
**Chats vivos cuando abrís esta wave:** 0.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F5.1` | 🔗 cadena C-F5-realtime: auto-continúa F5.2. |

### Wave B — se desbloquea **apenas F5.2 esté ✅** (2 chats nuevos)

**Gating:** `F5.2 ✅` (single-dep).
**Chats anteriores que pueden seguir vivos:** ninguno (Chat 1 cerró su cadena en F5.2).

| Chat | Task ID | Notas |
|---|---|---|
| 2 | `F5.3` | Integración con React Query. |
| 3 | `F5.4` | Reconnect + backoff. |

### Wave C — se desbloquea cuando **F12 y F13 estén parcialmente avanzadas** (1 chat de cierre)

> F5.5 es un test E2E de propagación que necesita features reales de Cliente y Tienda para disparar transiciones del pedido. No tiene sentido correrlo antes de que esas features existan. Esta wave se abre **mucho más tarde** que el resto de F5 — durante la ejecución de F12/F13.

**Gating:** F12 y F13 con flujos de pedido funcionales (≥ F12.3 + F13.5).
**Chats anteriores que pueden seguir vivos:** ninguno de F5.

| Chat | Task ID | Notas |
|---|---|---|
| 4 | `F5.5` | Test E2E propagación <5s. |

**Cierre de F5:** 5 tareas ✅.

---

# FASE 6 — PWA

**Pre-requisito:** F1 ✅, F0.8 ✅ (Next 15).
**Decisiones pendientes:** ninguna.
**Total de chats:** 5.

### Wave A — arranque (1 chat — T0)

**Gating:** F1 ✅ + F0.8 ✅.
**Chats vivos cuando abrís esta wave:** 0.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F6.1` | Serwist setup — bottleneck de toda F6. |

### Wave B — se desbloquea **apenas F6.1 esté ✅** (4 chats nuevos)

**Gating:** `F6.1 ✅` (single-dep).
**Chats anteriores que pueden seguir vivos:** ninguno.

| Chat | Task ID | Notas |
|---|---|---|
| 2 | `F6.2` | Estrategia offline. |
| 3 | `F6.3` | Web Push (necesita F0.2 env para VAPID). |
| 4 | `F6.4` | Install prompt. |
| 5 | `F6.5` | Background sync (necesita F4.2). |

**Cierre de F6:** 5 tareas ✅.

---

# FASE 7 — Testing infrastructure

**Pre-requisito:** F0.5 ✅, F1.1 ✅.
**Decisiones pendientes:** ninguna.
**Total de chats:** 6.

### Wave A — arranque (1 chat — T0)

**Gating:** F0.5 ✅ + F1.1 ✅.
**Chats vivos cuando abrís esta wave:** 0.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F7.1` | Testing library setup — bottleneck. |

### Wave B — se desbloquea **apenas F7.1 esté ✅** (4 chats nuevos)

**Gating:** `F7.1 ✅` (single-dep).
**Chats anteriores que pueden seguir vivos:** ninguno.

| Chat | Task ID | Notas |
|---|---|---|
| 2 | `F7.2` | Factories y fixtures (necesita F3.1). |
| 3 | `F7.3` | Tests de state machine (necesita F3.2). |
| 4 | `F7.4` | Tests de hooks críticos. |
| 5 | `F7.6` | Coverage en CI con umbral. |

### Wave C — se desbloquea **apenas F7.2 esté ✅** (1 chat nuevo)

**Gating:** `F7.2 ✅` (single-dep).
**Chats anteriores que pueden seguir vivos:** Chats 3, 4, 5 de Wave B si todavía no cerraron.

| Chat | Task ID | Notas |
|---|---|---|
| 6 | `F7.5` | Component tests (smart vs dumb). |

**Cierre de F7:** 6 tareas ✅ (F7.7 queda deferred).

---

# FASE 8 — Observability

**Pre-requisito:** F1.3 ✅, F3.2 ✅, **DP-3 y DP-4 resueltas**.
**Decisiones pendientes:** DP-3 (observability stack), DP-4 (feature flags).
**Total de chats:** 5.

### Wave A — arranque (4 chats — T0)

**Gating:** F1.3 ✅ + F3.2 ✅ + DP-3 + DP-4.
**Chats vivos cuando abrís esta wave:** 0.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F8.1` | Sentry setup. |
| 2 | `F8.2` | Analytics de producto. |
| 3 | `F8.4` | Feature flags. |
| 4 | `F8.5` | Structured logging server-side. |

### Wave B — se desbloquea **apenas F8.2 esté ✅** (1 chat nuevo)

**Gating:** `F8.2 ✅` (single-dep).
**Chats anteriores que pueden seguir vivos:** Chats 1, 3, 4 de Wave A.

| Chat | Task ID | Notas |
|---|---|---|
| 5 | `F8.3` | KPI instrumentation. |

**Cierre de F8:** 5 tareas ✅.

---

# FASE 9 — Design system

**Pre-requisito:** F1.8 ✅, F0.6 ✅.
**Decisiones pendientes:** ninguna.
**Total de chats:** 6.

### Wave A — arranque (6 chats paralelos — T0)

> ⚠️ **Conflict de archivo dentro de la wave:** F9.1 y F9.4 ambos tocan `tailwind.config.ts`. Hay 2 opciones:
> - **(a)** Asignar ambas tareas al mismo chat (corre F9.1 → F9.4 secuencial). Resulta en **5 chats** en vez de 6.
> - **(b)** Mantener 6 chats pero serializar el merge a main: el primero merge limpio, el segundo `git pull --rebase` y resuelve.
> Recomendación: **(a)** si querés cero fricción.

**Gating:** F1.8 ✅ + F0.6 ✅.
**Chats vivos cuando abrís esta wave:** 0.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F9.1` | Escala spacing en Tailwind. ⚠️ `tailwind.config.ts`. |
| 2 | `F9.2` | Tipografía sistematizada. |
| 3 | `F9.3` | Icon system. |
| 4 | `F9.4` | Motion primitives. ⚠️ `tailwind.config.ts` (coordinar con Chat 1). |
| 5 | `F9.6` | Dark mode audit. |
| 6 | `F9.7` | Contrast audit. |

**Cierre de F9:** 6 tareas ✅ (F9.5 Storybook queda deferred).

---

# FASE 10 — i18n + a11y

**Pre-requisito:** F0.6 ✅, **DP-7 resuelta** (multi-país).
**Decisiones pendientes:** DP-7.
**Total de chats:** 4.

### Wave A — arranque (2 chats — T0)

**Gating:** F0.6 ✅ + DP-7.
**Chats vivos cuando abrís esta wave:** 0.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F10.1` | next-intl setup. |
| 2 | `F10.3` | ARIA audit. |

### Wave B — convergencia: se desbloquea cuando **F10.1 + F10.3** estén ✅ (2 chats)

> Convergencia real: F10.2 migra el copy a `messages` (necesita next-intl, F10.1) y F10.4 hace keyboard navigation (necesita el ARIA audit como base, F10.3). Cada uno necesita su dependencia respectiva — son 2 deps, ambas necesarias.

**Gating:** `F10.1 ✅ AND F10.3 ✅` (convergencia).
**Chats anteriores que pueden seguir vivos:** ninguno (ambos de Wave A cerraron).

| Chat | Task ID | Notas |
|---|---|---|
| 3 | `F10.2` | Migrar copy a messages. |
| 4 | `F10.4` | Keyboard navigation. |

**Cierre de F10:** 4 tareas ✅.

---

# FASE 11 — Mapa real

**Pre-requisito:** F0.2 ✅, **DP-5 resuelta** (tile provider).
**Decisiones pendientes:** DP-5.
**Total de chats:** 6.
**⚠️ Fase muy serial.** Cada wave tiene 1 chat (excepto Wave D). Casi todo es bloqueante en cadena.

### Wave A (1 chat — T0)

**Gating:** F0.2 ✅ + DP-5.
**Chats vivos cuando abrís esta wave:** 0.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F11.1` | Decisión tile provider (implementación). |

### Wave B — se desbloquea **apenas F11.1 esté ✅** (1 chat)

**Gating:** `F11.1 ✅` (single-dep).
**Chats anteriores que pueden seguir vivos:** ninguno.

| Chat | Task ID | Notas |
|---|---|---|
| 2 | `F11.2` | Install react-map-gl + MapLibre. |

### Wave C — se desbloquea **apenas F11.2 esté ✅** (1 chat)

**Gating:** `F11.2 ✅` (single-dep).
**Chats anteriores que pueden seguir vivos:** ninguno.

| Chat | Task ID | Notas |
|---|---|---|
| 3 | `F11.3` | Reemplazar MapCanvas placeholder. |

### Wave D — se desbloquea **apenas F11.3 esté ✅** (2 chats nuevos en paralelo)

**Gating:** `F11.3 ✅` (single-dep).
**Chats anteriores que pueden seguir vivos:** ninguno.

| Chat | Task ID | Notas |
|---|---|---|
| 4 | `F11.4` | Clustering. |
| 5 | `F11.5` | User location tracking. |

### Wave E — se desbloquea **apenas F11.4 esté ✅** (1 chat)

> F11.6 (performance pass) necesita el clustering en su lugar. F11.5 puede seguir vivo o haber cerrado, irrelevante.

**Gating:** `F11.4 ✅` (single-dep).
**Chats anteriores que pueden seguir vivos:** Chat 5 (F11.5).

| Chat | Task ID | Notas |
|---|---|---|
| 6 | `F11.6` | Performance pass mobile. |

**Cierre de F11:** 6 tareas ✅.

---

# FASE 12 — Features Cliente

**Pre-requisito:** F2 ✅, F3 ✅, F4 ✅, F5.3 ✅.
**Decisiones pendientes:** ninguna.
**Total de chats:** 6.
**⚡ Corre en paralelo con F13 y F14 (trillizas).**

### Wave A — arranque (6 chats paralelos — T0)

**Gating:** F2 ✅ + F3 ✅ + F4 ✅ + F5.3 ✅.
**Chats vivos cuando abrís esta wave:** 0 (de F12, pero hasta 12 más entre F13 y F14 si las trillizas corren juntas).

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F12.1` | Store detail bottom sheet. |
| 2 | `F12.2` | Cart client state. |
| 3 | `F12.3` | 🔗 cadena C-F12-order: auto-continúa F12.4. |
| 4 | `F12.5` | Order history. |
| 5 | `F12.6` | Cancel flow. |
| 6 | `F12.7` | Profile + preferences. |

**Cierre de F12:** 7 tareas ✅.

---

# FASE 13 — Features Tienda

**Pre-requisito:** F2 ✅, F3 ✅, F4 ✅, F5.3 ✅.
**Decisiones pendientes:** ninguna.
**Total de chats:** 7.
**⚡ Corre en paralelo con F12 y F14 (trillizas).**

### Wave A — arranque (6 chats — T0)

**Gating:** F2 ✅ + F3 ✅ + F4 ✅ + F5.3 ✅.
**Chats vivos cuando abrís esta wave:** 0 (de F13).

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F13.1` | Dashboard home. |
| 2 | `F13.2` | Availability toggle + location publishing. |
| 3 | `F13.3` | Catálogo CRUD. |
| 4 | `F13.4` | Incoming orders inbox. |
| 5 | `F13.5` | Accept/reject/finalize flow. |
| 6 | `F13.6` | Store profile management. |

### Wave B — se desbloquea **apenas F8.3 esté ✅** (1 chat nuevo, cross-fase)

> F13.7 depende de KPI instrumentation (F8.3, fase 8). Si F8 todavía no llegó a F8.3, este chat espera. Los 6 chats de Wave A pueden seguir vivos en paralelo.

**Gating:** `F8.3 ✅` (single-dep, cross-fase).
**Chats anteriores que pueden seguir vivos:** los 6 de Wave A si todavía no cerraron.

| Chat | Task ID | Notas |
|---|---|---|
| 7 | `F13.7` | Analytics básico (depende de KPI instrumentation). |

**Cierre de F13:** 7 tareas ✅.

---

# FASE 14 — Features Admin

**Pre-requisito:** F2 ✅, F3 ✅, F4 ✅, F8.3 ✅.
**Decisiones pendientes:** ninguna.
**Total de chats:** 5.
**⚡ Corre en paralelo con F12 y F13 (trillizas). Máxima paralelización interna.**

### Wave A — arranque (5 chats simultáneos — T0)

**Gating:** F2 ✅ + F3 ✅ + F4 ✅ + F8.3 ✅.
**Chats vivos cuando abrís esta wave:** 0 (de F14).

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F14.1` | Dashboard KPIs. |
| 2 | `F14.2` | Store validation queue. |
| 3 | `F14.3` | Content moderation. |
| 4 | `F14.4` | Order audit log. |
| 5 | `F14.5` | User management. |

**Cierre de F14:** 5 tareas ✅. **Si las trillizas se ejecutan simultáneas, el pico teórico de chats concurrentes es ~18** (6 + 7 + 5).

---

# FASE 15 — Performance y escalabilidad

**Pre-requisito:** F4 ✅, F8.4 ✅, F0.7 ✅.
**Decisiones pendientes:** DP-1 (para F15.5).
**Total de chats:** 6.

### Wave A — arranque (5 chats — T0)

**Gating:** F4 ✅ + F8.4 ✅ + F0.7 ✅.
**Chats vivos cuando abrís esta wave:** 0.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F15.1` | Bundle analysis. |
| 2 | `F15.2` | RSC boundaries review. |
| 3 | `F15.3` | Image optimization. |
| 4 | `F15.4` | Edge caching strategy. |
| 5 | `F15.5` | Database query optimization. |

### Wave B — se desbloquea **apenas F15.5 esté ✅** (1 chat)

**Gating:** `F15.5 ✅` (single-dep).
**Chats anteriores que pueden seguir vivos:** Chats 1, 2, 3, 4 de Wave A.

| Chat | Task ID | Notas |
|---|---|---|
| 6 | `F15.6` | Load testing. |

**Cierre de F15:** 6 tareas ✅.

---

# FASE 16 — Seguridad y compliance

**Pre-requisito:** F2 ✅, F3 ✅.
**Decisiones pendientes:** DP-7 (para F16.7).
**Total de chats:** 7.

### Wave A — arranque (6 chats — T0)

**Gating:** F2 ✅ + F3 ✅.
**Chats vivos cuando abrís esta wave:** 0.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F16.1` | Rate limiting. |
| 2 | `F16.2` | Audit log inmutable (necesita F3.2). |
| 3 | `F16.3` | Privacy policy + terms. |
| 4 | `F16.4` | Privacidad ubicación (necesita F12.4, F13.4). |
| 5 | `F16.5` | Secret rotation runbook. |
| 6 | `F16.6` | Dependabot + pnpm audit. |

### Wave B — se desbloquea cuando **DP-7 esté resuelta** (1 chat)

> Esta wave no espera a un task — espera a una **decisión humana** (DP-7: multi-país). Hasta que vos resuelvas la DP, F16.7 queda en `🔴 blocked`.

**Gating:** DP-7 resuelta (decisión humana).
**Chats anteriores que pueden seguir vivos:** los 6 de Wave A.

| Chat | Task ID | Notas |
|---|---|---|
| 7 | `F16.7` | GDPR/LGPD readiness. |

**Cierre de F16:** 7 tareas ✅.

---

# FASE 17 — DevEx y docs

**Pre-requisito:** F0 ✅ entera.
**Decisiones pendientes:** DP-8 (para F17.5).
**Total de chats:** 5.

### Wave A — arranque (4 chats — T0)

**Gating:** F0 ✅ entera.
**Chats vivos cuando abrís esta wave:** 0.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F17.1` | Contributing guide. |
| 2 | `F17.2` | ADRs + primeros registros. |
| 3 | `F17.3` | Onboarding doc. |
| 4 | `F17.4` | Changelog automatizado. |

### Wave B — se desbloquea cuando **DP-8 esté resuelta y sea positiva** (1 chat opcional)

> Esta wave es **condicional**: si DP-8 se resuelve a "no monorepo", F17.5 queda como `⏸️ deferred` y la wave no se ejecuta nunca.

**Gating:** DP-8 resuelta = "sí".
**Chats anteriores que pueden seguir vivos:** los 4 de Wave A.

| Chat | Task ID | Notas |
|---|---|---|
| 5 | `F17.5` | Monorepo evaluation + migration. |

**Cierre de F17:** 4-5 tareas ✅ según DP-8.

---

# FASE 18 — Producción

**Pre-requisito:** F8 ✅, F16 ✅.
**Decisiones pendientes:** DP-1 (para F18.6).
**Total de chats:** 6.

### Wave A — arranque (4 chats — T0)

**Gating:** F8 ✅ + F16 ✅.
**Chats vivos cuando abrís esta wave:** 0.

| Chat | Task ID | Notas |
|---|---|---|
| 1 | `F18.1` | Multi-environment config. |
| 2 | `F18.2` | Vercel deployment config. |
| 3 | `F18.5` | Runbooks de incidentes. |
| 4 | `F18.6` | Disaster recovery. |

### Wave B — convergencia: se desbloquea cuando **F18.1 + F18.2** estén ✅ (1 chat)

**Gating:** `F18.1 ✅ AND F18.2 ✅` (convergencia).
**Chats anteriores que pueden seguir vivos:** Chats 3, 4 (F18.5, F18.6).

| Chat | Task ID | Notas |
|---|---|---|
| 5 | `F18.3` | Monitoring dashboards. |

### Wave C — se desbloquea **apenas F18.3 esté ✅** (1 chat)

**Gating:** `F18.3 ✅` (single-dep).
**Chats anteriores que pueden seguir vivos:** Chats 3, 4 si todavía no cerraron.

| Chat | Task ID | Notas |
|---|---|---|
| 6 | `F18.4` | Alerting rules. |

**Cierre de F18:** 6 tareas ✅. **PROYECTO LISTO PARA PRODUCCIÓN.**

---

## Resumen ejecutivo — total de chats por fase

| Fase | Nombre | Total chats | Pico paralelo dentro de la fase | Gating inicial |
|---|---|---|---|---|
| F0 | Dev infrastructure | 7 | 4 | ninguno |
| F1 | Capas transversales | 7 | 5 | F0 ✅ |
| F2 | Auth + roles | 5 | 4 | F1 ✅ + F3.1 + DP-2 |
| F3 | Domain model | 5 | 4 | F0 ✅ |
| F4 | Data layer | 4 | 3 | F1 + F3 ✅ |
| F5 | Realtime | 4 | 2 | F2 + F3 ✅ + DP-1 |
| F6 | PWA | 5 | 4 | F1 + F0.8 ✅ |
| F7 | Testing | 6 | 4 | F0.5 + F1.1 ✅ |
| F8 | Observability | 5 | 4 | F1.3 + F3.2 + DP-3/4 |
| F9 | Design system | 6 | 6 | F1.8 ✅ |
| F10 | i18n + a11y | 4 | 2 | F0.6 + DP-7 |
| F11 | Mapa real | 6 | 2 | F0.2 + DP-5 |
| F12 | Features Cliente | 6 | 6 | F2+F3+F4+F5.3 ✅ |
| F13 | Features Tienda | 7 | 6 | F2+F3+F4+F5.3 ✅ |
| F14 | Features Admin | 5 | 5 | F2+F3+F4+F8.3 ✅ |
| F15 | Performance | 6 | 5 | F4+F8.4+F0.7 ✅ |
| F16 | Security | 7 | 6 | F2+F3 ✅ |
| F17 | DevEx + docs | 5 | 4 | F0 ✅ |
| F18 | Producción | 6 | 4 | F8+F16 ✅ |

**Total de invocaciones de chat durante todo el proyecto:** ~106.
**Pico concurrente teórico (F12+F13+F14 trillizas):** ~18 chats simultáneos.
**Pico concurrente realista (F6+F7+F8+F9+F10+F11 ventana paralela):** ~25+ chats si se quiere acelerar al máximo.

---

## Protocolo operativo

### Antes de abrir una wave

1. Abrir el epic y verificar que **el gating de esa wave** esté cumplido (las tareas listadas en `Gating:` están `✅ done`, o las DPs resueltas).
2. **No verificar nada más.** No importa si los chats de waves anteriores siguen vivos — eso es justamente el punto del paralelismo.
3. Verificar que las tareas de la wave nueva no estén ya `🟡 in-progress` tomadas por otro chat (race protection).
4. Crear los worktrees de la wave (uno por chat) desde el directorio principal:
   ```bash
   git worktree add ../ambulante-<task-id> -b feat/<task-id>-<slug>
   ```
5. Abrir N ventanas de Claude Code, una por worktree:
   ```bash
   cd ~/Desktop/ambulante-<task-id> && claude
   ```

### Al abrir cada chat de la wave

1. Copiar el template de `docs/PROMPT-TEMPLATE.md` (sección "## TEMPLATE — copiar desde acá").
2. Reemplazar `{{TASK_IDS}}` con el Task ID de esa fila de la wave.
3. Pegar como primer mensaje del chat. El PASO 0 del template verifica automáticamente que estés en el worktree correcto.

### Durante la ejecución

- Cada chat reporta su progreso vía los separadores `## PASO N ·`.
- Al cerrar una tarea, el epic se actualiza automáticamente (PASO 7 del template).
- Si la tarea tiene `Continues with:`, el chat auto-claim el siguiente eslabón y sigue (PASO 8) — ese chat queda vivo más tiempo.
- **Vos podés abrir nuevas waves en paralelo apenas se cumplan sus gatings.** No esperás a que los chats activos cierren.

### Al cerrar una wave

1. Verificar en el epic que todas las tareas de la wave estén `✅ done`.
2. Hacer `git pull` en el directorio principal para traer las actualizaciones de otros chats.
3. Limpiar los worktrees consumidos:
   ```bash
   git worktree remove ../ambulante-<task-id>
   ```
4. Si se completó toda la fase, pasar a la siguiente fase de este doc.

### Manejo de bloqueos

- Si una tarea aparece `🔴 blocked` por una decisión pendiente (DP-X) → resolver la decisión antes de seguir.
- Si un chat reporta un conflicto no resuelto → pausar ese chat, investigar, resolver, resumir.
- Si un chat detecta un issue fuera de scope (ej. pagos en una tarea del §5 del PRD) → **parar y preguntar**, nunca seguir sin confirmación.
- Si dos chats van a editar el mismo archivo crítico (`package.json`, `tailwind.config.ts`, etc.) → marcar `⚠️` en la wave correspondiente y serializar **el merge a main**, no el desarrollo.

---

## Anti-patrones comunes

| Anti-patrón | Por qué está mal | Qué hacer en su lugar |
|---|---|---|
| "Espero a que la Wave A entera cierre antes de abrir Wave B" | Wave B se desbloquea con su gating, no con que Wave A "termine". Estás dejando tiempo de chat sin usar. | Abrí Wave B apenas su gating se cumpla, en paralelo con los chats vivos de Wave A. |
| "Cierro los chats de Wave A cuando abro Wave B" | Los chats de cadena (🔗) tienen tareas pendientes — cerrarlos rompe la auto-continuación. | Dejá los chats vivos hasta que terminen solos. Solo cerrás cuando reportan "Cadena cerrada". |
| "Comparten todos los chats el mismo `~/Desktop/ambulante/`" | Race condition determinístico en `.git/HEAD`. Los commits caen en branches equivocadas. | Cada chat en su propio `git worktree`. Sin excepciones. |
| "No esperé al gating, abrí F0.7 antes de tener F0.5" | F0.7 (CI workflow) ejecuta `pnpm test` y se rompe si Vitest no está configurado. Convergencia es convergencia. | Respetá las convergencias explícitas. Las single-deps son liberales; las convergencias son estrictas. |
| "Hago F1 mientras F0 todavía tiene F0.7 abierto" | F1 espera a **F0 entera** (convergencia a nivel fase). Las fases nuevas son siempre estrictas. | Esperá a que toda F0 cierre. Mientras tanto, resolvé DPs o trabajá en producto. |

---

## Changelog

| Fecha | Cambio |
|---|---|
| 2026-04-15 | Creación del plan operativo con batches por fase validados contra dependencias del epic |
| 2026-04-15 | Reescritura mayor: "Batch" → "Wave" para alinearse al lenguaje del epic; agregadas secciones "Cómo se interpreta una Wave", diagrama temporal de F0, distinción explícita single-dep vs convergencia, anti-patrones comunes; cada wave de cada fase ahora declara su gating, qué chats anteriores siguen vivos, y notas explícitas de paralelismo cross-wave |
