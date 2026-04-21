# Load Tests — Ambulante

Escenarios de load testing con k6. Ver `docs/load-testing.md` para documentación completa.

## Orden de ejecución

```bash
k6 run load-tests/scenarios/smoke.js          # 1. Smoke (siempre primero)
k6 run load-tests/scenarios/store-discovery.js # 2. Geoquery concurrente
k6 run load-tests/scenarios/order-flow.js      # 3. Ciclo de pedido
k6 run load-tests/scenarios/location-update.js # 4. Ubicación de tiendas
k6 run load-tests/scenarios/spike.js           # 5. Spike de resiliencia
```

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `BASE_URL` | `http://localhost:3000` | URL del servidor a testear |
