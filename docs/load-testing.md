# Load Testing — Ambulante

> **Herramienta:** [k6](https://k6.io/) — JavaScript, CLI, CI-friendly.
> **Estado:** Scripts listos. Backend aún no existe (todo mock) — los tests están
> diseñados para correr contra el backend real cuando entre Supabase (F8).
> **Escenarios mapeados a:** PRD §8 (métricas de éxito) + §9.3 (concurrencia).

---

## 1. Escenarios y mapping a PRD §8

| Escenario | Archivo | KPI §8 | Target |
|---|---|---|---|
| **Smoke** | `scenarios/smoke.js` | Baseline general | Stack responde en < 500ms |
| **Store discovery** | `scenarios/store-discovery.js` | Tiendas activas concurrentes | p95 < 300ms (geoquery Q1) |
| **Order flow** | `scenarios/order-flow.js` | Pedidos/día · Tasa aceptación · Tiempo respuesta | Throughput estable · ≥ 60% aceptación · p95(RECIBIDO→ACEPTADO) < 3 min |
| **Location update** | `scenarios/location-update.js` | Tiendas activas concurrentes | 100 tiendas concurrentes · p95 write < 200ms |
| **Spike** | `scenarios/spike.js` | Resiliencia (§9.3) | Error rate < 5% · 0 race condition 5xx |

---

## 2. Baselines y goals (SLO)

### 2.1 Estado actual

El backend no existe todavía — los tests correrán inicialmente contra mocks de Next.js.
Los valores de baseline se poblarán en la primera ejecución contra el backend real.

| Métrica | Baseline actual | Goal MVP |
|---|---|---|
| p95 geoquery (Q1) | TBD | < 300ms |
| p95 order creation (POST /api/orders) | TBD | < 500ms |
| p95 status transition | TBD | < 200ms |
| p95 location write | TBD | < 200ms |
| Tasa de error global | TBD | < 1% |
| Concurrent VUs soportados sin degradación | TBD | 50 concurrent clients |
| Tiendas activas concurrentes | TBD | 100 simultáneas |
| Tasa de aceptación (negocio) | TBD | ≥ 60% |
| Tasa de finalización (negocio) | TBD | ≥ 70% |
| Tasa de expiración (negocio) | TBD | < 15% |

### 2.2 Thresholds técnicos por escenario

```
smoke:
  http_req_duration: p(95) < 500ms
  http_req_failed:   rate < 1%

store-discovery (crítico — Q1 PostGIS):
  http_req_duration: p(95) < 300ms, p(99) < 800ms
  http_req_failed:   rate < 0.5%

order-flow:
  http_req_duration:   p(95) < 500ms
  order_acceptance_ms: p(95) < 180000 (3 min)
  http_req_failed:     rate < 1%

location-update:
  http_req_duration:     p(95) < 200ms
  location_write_errors: rate < 1%

spike (tolerancias más altas por diseño):
  http_req_duration: p(95) < 2000ms
  http_req_failed:   rate < 5%
  race_condition_5xx: rate < 1% (crítico — nunca 5xx en concurrencia)
```

---

## 3. Instalación

```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] \
  https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Docker (no instalación local)
docker run --rm -i grafana/k6 run - < load-tests/scenarios/smoke.js
```

---

## 4. Cómo correr

### Pre-requisito

El servidor debe estar corriendo:

```bash
# Contra dev (mock):
pnpm dev

# Contra producción/staging:
export BASE_URL=https://ambulante.vercel.app
```

### Ejecución por escenario

```bash
# 1. Smoke — siempre primero
k6 run load-tests/scenarios/smoke.js

# 2. Store discovery
k6 run load-tests/scenarios/store-discovery.js

# 3. Order flow
k6 run load-tests/scenarios/order-flow.js

# 4. Location update
k6 run load-tests/scenarios/location-update.js

# 5. Spike (solo si 1-4 pasaron)
k6 run load-tests/scenarios/spike.js
```

### Override de parámetros

```bash
# Cambiar base URL
k6 run -e BASE_URL=https://staging.ambulante.app load-tests/scenarios/store-discovery.js

# Output JSON para análisis
k6 run --out json=results/store-discovery-$(date +%Y%m%d).json \
  load-tests/scenarios/store-discovery.js

# Output InfluxDB/Grafana (CI)
k6 run --out influxdb=http://localhost:8086/k6 \
  load-tests/scenarios/order-flow.js
```

---

## 5. Interpretar resultados

### Output de k6

```
✓ nearby stores status 200       100.00% 1234 (1234 passed / 0 failed)
✗ nearby stores p95 < 300ms       94.20% 1163 passed / 71 failed  ← revisar si falla

http_req_duration............: avg=127.4ms min=8.2ms med=98.1ms max=892.1ms p(90)=243ms p(95)=287ms
http_req_failed..............: 0.12%  ✓ 1 threshold passed
geoquery_duration_ms.........: avg=134ms  p(95)=291ms  ← custom metric
```

### Qué buscar

| Señal | Acción |
|---|---|
| p95 > threshold | Revisar query plan con EXPLAIN (ver `docs/db-query-optimization.md`) |
| Error rate > 1% | Revisar logs del servidor — posible rate limiting o timeout |
| `race_condition_5xx > 0` | Prioridad máxima — revisar locking en transición de estados |
| `location_write_errors` sube con 100 VUs | Revisar índice en `stores.location_updated_at` |
| `order_acceptance_ms p95 > 180000` | Threshold de negocio superado — revisar notificaciones push a la tienda |

### Degradation profile esperado

Para el MVP con Supabase + Vercel Edge:
- **0-50 VUs:** latencia estable, sin degradación
- **50-100 VUs:** ligero aumento en p99, p95 debe mantenerse
- **100+ VUs (spike):** p95 puede superar threshold temporalmente; p99 acepta hasta 2s; 0 5xx

---

## 6. Integración en CI

Agregar en `.github/workflows/ci.yml` (cuando exista backend real):

```yaml
load-test-smoke:
  runs-on: ubuntu-latest
  needs: deploy-staging
  steps:
    - uses: actions/checkout@v4
    - name: Run k6 smoke test
      uses: grafana/k6-action@v0.3.1
      with:
        filename: load-tests/scenarios/smoke.js
      env:
        BASE_URL: ${{ secrets.STAGING_URL }}
```

El smoke test en CI detecta regresiones de performance en cada deploy.
Los escenarios de carga completa (load, spike) se corren manualmente antes de releases mayores.

---

## 7. Decisiones de diseño

**Por qué k6 y no Artillery:**
k6 usa JavaScript (mismo ecosistema que el proyecto), tiene un CLI simple, integración
nativa con Grafana/InfluxDB para visualización, y soporte activo. Artillery es más
orientado a YAML y tiene más fricción para custom metrics.

**Por qué los escenarios no corren todavía contra la app real:**
El backend es todo mock. Los scripts están diseñados para el contrato de API que se
implementará en F8 (Supabase client). Correr contra el servidor de mocks mide latencia
del mock, no del stack real — útil solo como smoke test básico.

**Por qué el spike usa 20 "hot orders":**
PRD §9.3 requiere validar race conditions en transiciones concurrentes. Con 500 VUs y
20 órdenes compartidas, la probabilidad de colisión simultánea es muy alta — esto forza
al servidor a ejercitar el path de resolución de conflicto en cada run.

**Thresholds del smoke más permisivos:**
El smoke corre contra el servidor de desarrollo que incluye el overhead de HMR y
compilación incremental. Los thresholds reales aplican solo contra build de producción.
