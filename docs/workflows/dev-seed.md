# Dev Seed — Guía de uso

Datos de desarrollo cargados automáticamente en `supabase db reset`.
Referencia rápida de cuentas, tiendas y pedidos disponibles para testear localmente.

---

## Cómo aplicar el seed

```bash
# Reset completo: corre migraciones + seed (borra todo lo anterior)
pnpm supabase:reset

# El seed también se puede aplicar manualmente sin resetear:
npx supabase db query --file supabase/seed.sql
```

El seed es idempotente — podés correrlo varias veces sin duplicar datos (usa `ON CONFLICT DO NOTHING` con UUIDs fijos).

---

## Cuentas de desarrollo

| Rol    | Email                          | Contraseña      |
|--------|--------------------------------|-----------------|
| cliente | `cliente@dev.ambulante.local` | `Ambulante123!` |
| tienda  | `tienda@dev.ambulante.local`  | `Ambulante123!` |
| admin   | `admin@dev.ambulante.local`   | `Ambulante123!` |

---

## Tiendas (5 zonas de CABA)

Todas son propiedad de `tienda@dev.ambulante.local`.

| # | Nombre                       | Zona         | Estado      |
|---|------------------------------|--------------|-------------|
| 1 | El Choripán de Pedro         | Palermo      | Disponible  |
| 2 | Sushi Ambulante              | San Telmo    | Disponible  |
| 3 | Helados Artesanales Nonna    | Recoleta     | No disponible |
| 4 | Tacos & Burritos Express     | Villa Crespo | Disponible  |
| 5 | Café en Ruedas               | Caballito    | No disponible |

---

## Productos (20 total, 4 por tienda)

| Tienda | Productos                                                          |
|--------|--------------------------------------------------------------------|
| 1      | Choripán simple · Choripán con chimichurri · Morcipán · Bondiola  |
| 2      | Nigiri salmón (6u) · California roll (8u) · Temaki atún · Edamame |
| 3      | Kilo chocolate · Medio kilo frutilla · 1/4 kilo vainilla · Sundae |
| 4      | Taco de pollo (3u) · Burrito de carne · Guacamole · Nachos        |
| 5      | Café americano · Latte · Medialunas (3u) · Tostado mixto          |

---

## Pedidos (10 estados distintos)

Todos realizados por `cliente@dev.ambulante.local`.

| # | Tienda | Estado     | Notas                                          |
|---|--------|------------|------------------------------------------------|
| 1 | 1      | enviado    | Expira en 10 min desde reset                   |
| 2 | 2      | recibido   | Tienda lo vio, aún sin respuesta               |
| 3 | 1      | aceptado   | Ubicación del cliente visible para la tienda   |
| 4 | 4      | en_camino  | Cliente en camino                              |
| 5 | 3      | finalizado | Completado hace 1h                             |
| 6 | 2      | rechazado  | Sin existencias de kani                        |
| 7 | 4      | cancelado  | Cancelado por el cliente antes de ser aceptado |
| 8 | 5      | expirado   | Tienda no respondió en 10 min                  |
| 9 | 1      | aceptado   | Segundo pedido activo                          |
| 10| 2      | finalizado | Completado hace 2h                             |

---

## Coordenadas de referencia

Útiles para mockear geolocalización en Chrome DevTools (`Sensors → Location`):

| Zona         | Lat        | Lng        |
|--------------|------------|------------|
| Palermo      | -34.5779   | -58.4328   |
| San Telmo    | -34.6214   | -58.3730   |
| Recoleta     | -34.5875   | -58.3975   |
| Villa Crespo | -34.5991   | -58.4398   |
| Caballito    | -34.6175   | -58.4461   |

---

## UUIDs fijos (para tests y scripts)

```
Auth users:
  cliente  00000000-0000-0000-0000-000000000001
  tienda   00000000-0000-0000-0000-000000000002
  admin    00000000-0000-0000-0000-000000000003

Stores:
  Palermo       10000000-0000-0000-0000-000000000001
  San Telmo     10000000-0000-0000-0000-000000000002
  Recoleta      10000000-0000-0000-0000-000000000003
  Villa Crespo  10000000-0000-0000-0000-000000000004
  Caballito     10000000-0000-0000-0000-000000000005

Orders (01–10):
  30000000-0000-0000-0000-00000000000{1..10}
```
