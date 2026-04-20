# KPI Dashboard — Ambulante

Fuente de verdad para construir los dashboards que miden los 6 KPIs del PRD §8.
Los eventos son emitidos por `kpiService` (`shared/services/kpi.ts`).

---

## KPIs y sus eventos fuente

| KPI | Definición (PRD §8) | Target MVP | Evento de source | Propiedad clave |
|---|---|---|---|---|
| Pedidos enviados / día | Volumen de intenciones de compra | Medir baseline | `ORDER_SENT` | count por día |
| Tasa de aceptación | % RECIBIDO → ACEPTADO | ≥ 60% | `ORDER_ACCEPTED` / (`ORDER_ACCEPTED` + `ORDER_REJECTED` + `ORDER_EXPIRED`) | — |
| Tasa de finalización | % ACEPTADO → FINALIZADO | ≥ 70% | `ORDER_FINISHED` / `ORDER_ACCEPTED` | — |
| Tiempo promedio de respuesta | Delta RECIBIDO → ACEPTADO/RECHAZADO | < 3 min (180 000 ms) | `ORDER_ACCEPTED` | `waitMs` (avg) |
| Tasa de expiración | % pedidos que llegan a EXPIRADO | < 15% | `ORDER_EXPIRED` / `ORDER_SENT` | — |
| Tiendas activas concurrentes | Tiendas con disponibilidad activa simultáneamente | Medir baseline | `STORE_AVAILABILITY_CHANGED` | `available: true` rolling count |

---

## Eventos disponibles

| Evento | Propiedades | Emitido por |
|---|---|---|
| `ORDER_SENT` | `storeId`, `itemCount` | `kpiService.trackOrderSent` |
| `ORDER_ACCEPTED` | `storeId`, `waitMs` | `kpiService.trackOrderAccepted` |
| `ORDER_REJECTED` | `storeId`, `reason?` | `kpiService.trackOrderRejected` |
| `ORDER_EXPIRED` | `storeId` | `kpiService.trackOrderExpired` |
| `ORDER_FINISHED` | `storeId`, `totalMs` | `kpiService.trackOrderFinalized` |
| `STORE_AVAILABILITY_CHANGED` | `storeId`, `available` | `kpiService.trackStoreAvailabilityChanged` |

---

## Configuración en Vercel Analytics

Vercel Analytics captura eventos custom vía `track()` del SDK `@vercel/analytics`.
El `analyticsService` de F8.2 se encarga del transporte; `kpiService` provee la capa de negocio.

### Pasos para configurar el dashboard

1. Abrí [vercel.com/dashboard](https://vercel.com/dashboard) → tu proyecto → pestaña **Analytics**.
2. Todos los eventos `ORDER_*` y `STORE_AVAILABILITY_CHANGED` aparecen automáticamente en la sección **Custom Events** una vez que se emitan en producción.
3. Para cada KPI, construí un chart en el panel **Insights**:

#### Pedidos enviados / día
- Event: `ORDER_SENT`
- Aggregation: `count`
- Group by: `day`

#### Tasa de aceptación
- Compará `count(ORDER_ACCEPTED)` vs `count(ORDER_ACCEPTED) + count(ORDER_REJECTED) + count(ORDER_EXPIRED)`
- Calculá como porcentaje en el dashboard del proveedor de analytics / Vercel Insights.

#### Tasa de finalización
- Numerador: `count(ORDER_FINISHED)`
- Denominador: `count(ORDER_ACCEPTED)`

#### Tiempo promedio de respuesta
- Event: `ORDER_ACCEPTED`
- Aggregation: `avg(waitMs)`
- Alert threshold: `waitMs > 180_000` (3 minutos)

#### Tasa de expiración
- Numerador: `count(ORDER_EXPIRED)`
- Denominador: `count(ORDER_SENT)`
- Alert threshold: > 15%

#### Tiendas activas concurrentes
- Event: `STORE_AVAILABILITY_CHANGED`
- Filter: `available = true`
- Aggregation: rolling `count(distinct storeId)` en ventana de 5 min

---

## Notas de implementación

- Los timings (`waitMs`, `totalMs`) se calculan en el cliente en el momento de la transición de estado. Para el MVP esto es suficiente; con backend real los timings deberían calcularse server-side para evitar clock skew.
- `STORE_AVAILABILITY_CHANGED` con `available: false` permite derivar el tiempo de sesión activa de cada tienda (`available=true timestamp` hasta `available=false timestamp`).
- El event `ORDER_SENT` registra `itemCount` para futuras correlaciones (pedidos más grandes → mayor tasa de aceptación?).
