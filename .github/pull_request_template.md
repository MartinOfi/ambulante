## Resumen

<!-- ¿Qué cambia y por qué? En 2-3 oraciones. -->

## Tarea del epic

<!-- ID de la tarea en docs/EPIC-ARCHITECTURE.md. Ej: F0.9, F1.3. -->
- **Task ID:**
- **Fase:**

## Tipo de cambio

- [ ] `feat` — nueva funcionalidad
- [ ] `fix` — bug fix
- [ ] `refactor` — reorganización sin cambio de comportamiento
- [ ] `docs` — solo documentación
- [ ] `test` — solo tests
- [ ] `chore` — infra / tooling / deps
- [ ] `perf` — performance
- [ ] `ci` — pipelines

## Checklist de calidad

Gates obligatorios antes de mergear (ver [`CLAUDE.md`](../CLAUDE.md) §6):

- [ ] `pnpm typecheck` pasa limpio
- [ ] `pnpm lint` pasa limpio
- [ ] `pnpm test` pasa limpio y coverage ≥80% en archivos nuevos
- [ ] `pnpm build` genera build de producción sin errores
- [ ] Respeta CLAUDE.md §6: sin `any`, sin magic strings/numbers, smart/dumb split, archivos ≤300 líneas, componentes ≤200
- [ ] Respeta CLAUDE.md §7 (invariantes de dominio): máquina de estados, privacidad de ubicación, aislamiento de roles
- [ ] Si toqué `shared/`, actualicé [`shared/REGISTRY.md`](../shared/REGISTRY.md) en este mismo PR
- [ ] Actualicé [`docs/EPIC-ARCHITECTURE.md`](../docs/EPIC-ARCHITECTURE.md) (estado de la tarea → `✅ done` + notas)
- [ ] Ningún cambio introduce features fuera de PRD §5 (sin pagos, sin stock, sin ratings, sin chat)
- [ ] Conventional commits en todos los commits del PR

## Screenshots / demos (opcional)

<!-- Si es cambio de UI, pegar capturas o grabaciones. -->

## Notas para el reviewer

<!-- Decisiones técnicas no obvias, tradeoffs, follow-ups detectados. -->
