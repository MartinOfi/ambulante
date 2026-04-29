# Decisiones de negocio del epic backend

> Decisiones BD-1 a BD-N. Si tu tarea las contradice, pará y consultá.

Estas decisiones no aparecen explícitas en PRD.md ni en EPIC-ARCHITECTURE.md pero deben quedar registradas porque condicionan tareas de este epic. Si se contradicen en el futuro, el epic se replanifica.

| # | Decisión | Fuente | Impacto |
|---|---|---|---|
| BD-1 | Retención de `audit_log` indefinida en MVP. Purga mensual (pedidos > 2 años) queda en NEXT-TASK.md. | decisión del brainstorming | B11.6, B13 |
| BD-2 | Retención de `store_locations` limitada a 30 días (append-only con cleanup automático). | invariante del PRD §7.5 + costo de storage | B10.2, B13 |
| BD-3 | Rate limits iniciales: 10 orders/h por cliente; 100 login attempts/h por IP; 1000 push sends/h global. Ajustables via env. | expert recommendation | B13.1 |
| BD-4 | Region Supabase: AWS SA-East-1 (baja latencia desde Argentina — alineado con DP-7). | DP-7 del epic frontend | B14.1 |
| BD-5 | Ubicación del cliente: se guarda en `orders.customer_location_point` (PostGIS `geography(point)`). El acceso se controla con RLS: el cliente ve siempre la suya; la tienda la ve **solo vía la security definer function `get_visible_customer_location(order_id)` que retorna NULL si `order.status < 'ACEPTADO'` o si el caller no es la tienda dueña**. No se encripta a nivel columna — RLS + función security definer es suficiente para el invariante PRD §7.2 y más simple que pgsodium. | invariante PRD §7.2 | B1.2, B2.1, B2.2 |
| BD-6 | IDs expuestos al cliente vía URL (orders.public_id, stores.public_id): UUID v4 por default (gen_random_uuid). Migración a UUIDv7 diferida a NEXT-TASK.md. | skill rule schema-primary-keys | B1.2 |
| BD-7 | Webhook de Supabase (logs → Sentry) queda detrás de un header secret, no de IP allowlist. | simplicidad operacional | B12.4 |
| BD-8 | **Cambios de schema solo via archivos de migración** en `supabase/migrations/`. Prohibido modificar la DB desde Supabase Studio UI (ni en local ni en prod). El drift check de CI (B0.4) falla si detecta cambios en la DB que no están en archivos de migración. No hay `synchronize:true` estilo ORM — no usamos ORM. | evitar drift schema↔código, auditabilidad | B0.4, todas las tareas con migraciones |

---
