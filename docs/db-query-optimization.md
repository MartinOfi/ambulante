# Database Query Optimization — Ambulante

> **Aplica a:** Supabase (Postgres 15 + PostGIS 3.x) — stack elegido en DP-1 (2026-04-16).
> **Estado:** Documento prospectivo. No hay backend real todavía — se aplica cuando entre F8 (Supabase client).
> **Audiencia:** Ingenieros que implementen el backend + DBA que revise el schema inicial.

---

## 1. Schema de tablas

Las tablas se infieren del dominio definido en el PRD. Se incluyen solo los campos
relevantes para indexing — no es un schema de migración exhaustivo.

```sql
-- Extensión obligatoria para geoqueries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─────────────────────────────────────
-- users
-- ─────────────────────────────────────
CREATE TABLE users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text UNIQUE NOT NULL,
  role        text NOT NULL CHECK (role IN ('client', 'store_owner', 'admin')),
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────
-- stores
-- ─────────────────────────────────────
CREATE TABLE stores (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id             uuid NOT NULL REFERENCES users(id),
  name                 text NOT NULL,
  validation_status    text NOT NULL DEFAULT 'pending'
                         CHECK (validation_status IN ('pending', 'approved', 'rejected')),
  is_active            boolean NOT NULL DEFAULT false,
  -- geography vs geometry: geography opera en metros sobre esfera WGS-84.
  -- Usar geography para ST_DWithin con radio en metros sin proyección manual.
  location             geography(Point, 4326),
  location_updated_at  timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────
-- products
-- ─────────────────────────────────────
CREATE TABLE products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name        text NOT NULL,
  price       numeric(10, 2) NOT NULL CHECK (price >= 0),
  description text,
  photo_url   text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────
-- orders
-- ─────────────────────────────────────
CREATE TABLE orders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES users(id),
  store_id    uuid NOT NULL REFERENCES stores(id),
  status      text NOT NULL DEFAULT 'ENVIADO'
                CHECK (status IN (
                  'ENVIADO', 'RECIBIDO', 'ACEPTADO',
                  'EN_CAMINO', 'FINALIZADO',
                  'RECHAZADO', 'CANCELADO', 'EXPIRADO'
                )),
  expires_at  timestamptz NOT NULL,  -- ENVIADO/RECIBIDO: +10min. ACEPTADO: +2h.
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────
-- order_items
-- ─────────────────────────────────────
-- product_snapshot preserva el estado del producto al momento del pedido (PRD §9.2).
-- Si el producto se edita o elimina, el pedido conserva lo que tenía.
CREATE TABLE order_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_snapshot jsonb NOT NULL,  -- { id, name, price, description } al momento de envío
  quantity         integer NOT NULL CHECK (quantity > 0)
);

-- ─────────────────────────────────────
-- order_transitions
-- ─────────────────────────────────────
-- Audit log de cada transición de estado (PRD §6.2: "registrar con timestamp").
CREATE TABLE order_transitions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status text,  -- NULL para la transición inicial ENVIADO
  to_status   text NOT NULL,
  actor_id    uuid REFERENCES users(id),  -- NULL para transiciones del sistema
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

---

## 2. Hot queries e índices

### Q1 — Tiendas activas dentro del radio del cliente (CRÍTICA)

**Feature:** C2 — Mapa de tiendas cercanas. Ejecutada cada vez que un cliente abre el mapa
o actualiza su posición. Máxima frecuencia de todas las queries.

```sql
SELECT
  id,
  name,
  ST_AsGeoJSON(location)::json AS location,
  ST_Distance(location, ST_MakePoint($lon, $lat)::geography) AS distance_meters
FROM stores
WHERE
  is_active = true
  AND validation_status = 'approved'
  AND ST_DWithin(
    location,
    ST_MakePoint($lon, $lat)::geography,
    $radius_meters  -- default 2000 (2km), configurable por el cliente
  )
ORDER BY distance_meters
LIMIT 50;
```

**Índices necesarios:**

```sql
-- Índice GIST sobre la columna geography — habilita búsqueda espacial O(log n)
CREATE INDEX idx_stores_location_gist
  ON stores USING GIST (location);

-- Índice parcial para filtrar primero por is_active y validation_status
-- antes de evaluar la condición espacial (reduce el espacio de búsqueda)
CREATE INDEX idx_stores_active_approved
  ON stores (is_active, validation_status)
  WHERE is_active = true AND validation_status = 'approved';
```

**Por qué dos índices:** Postgres puede combinar `idx_stores_active_approved` (bitmap scan)
con `idx_stores_location_gist` (index scan) vía BitmapAnd. Esto reduce el conjunto
que pasa al filtro espacial antes de evaluar `ST_DWithin`, que es costoso.

---

### Q2 — Pedidos pendientes de una tienda (T5 — bandeja de pedidos)

**Feature:** T5 — Lista de pedidos que la tienda debe resolver. Alta frecuencia: se refresca
vía Supabase Realtime al llegar cada nuevo pedido.

```sql
SELECT
  o.*,
  json_agg(oi.*) AS items
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE
  o.store_id = $store_id
  AND o.status NOT IN ('FINALIZADO', 'RECHAZADO', 'CANCELADO', 'EXPIRADO')
GROUP BY o.id
ORDER BY o.created_at DESC;
```

**Índice:**

```sql
CREATE INDEX idx_orders_store_status_created
  ON orders (store_id, status, created_at DESC);
```

**Por qué:** el filtro es siempre `store_id = $store_id` + exclusión de 4 estados terminales.
Un índice compuesto `(store_id, status)` permite index scan + filtrado sin heap scan
para el caso común (pocas filas activas por tienda).

---

### Q3 — Pedido activo de un cliente (C6 — seguimiento de estado)

**Feature:** C6 — El cliente ve el estado de su pedido en curso.

```sql
SELECT o.*, s.name AS store_name
FROM orders o
JOIN stores s ON s.id = o.store_id
WHERE
  o.client_id = $client_id
  AND o.status NOT IN ('FINALIZADO', 'RECHAZADO', 'CANCELADO', 'EXPIRADO')
ORDER BY o.created_at DESC
LIMIT 1;
```

**Índice:**

```sql
CREATE INDEX idx_orders_client_status_created
  ON orders (client_id, status, created_at DESC);
```

---

### Q4 — Historial paginado de pedidos del cliente (C7)

**Feature:** C7 — Historial. Baja frecuencia, alta latencia tolerable.

```sql
SELECT o.*, s.name AS store_name
FROM orders o
JOIN stores s ON s.id = o.store_id
WHERE o.client_id = $client_id
ORDER BY o.created_at DESC
LIMIT 20 OFFSET $offset;
```

**Índice:** reutiliza `idx_orders_client_status_created` del Q3 — Postgres puede usarlo
para el ORDER BY aunque no filtre por `status`.

**Nota sobre OFFSET:** Para cursores de paginación a gran escala, preferir
`WHERE created_at < $cursor_created_at` sobre `OFFSET` para evitar full index scan
hasta la página N. En MVP con historial pequeño, OFFSET es aceptable.

---

### Q5 — Catálogo activo de una tienda (C3 — detalle de tienda)

**Feature:** C3 — El cliente ve los productos de la tienda antes de pedir.

```sql
SELECT id, name, price, description, photo_url
FROM products
WHERE store_id = $store_id AND is_active = true
ORDER BY name;
```

**Índice:**

```sql
CREATE INDEX idx_products_store_active
  ON products (store_id, is_active)
  WHERE is_active = true;
```

---

### Q6 — UPSERT de ubicación de tienda (T4 — alta frecuencia)

**Feature:** T4 — La tienda reporta su posición cada 30–60s mientras está activa (PRD §7.5).
Es la query de escritura más frecuente del sistema.

```sql
UPDATE stores
SET
  location             = ST_MakePoint($lon, $lat)::geography,
  location_updated_at  = now()
WHERE id = $store_id AND is_active = true;
```

**Índice:** primary key lookup — sin índice adicional necesario.
El índice GIST de Q1 se actualiza automáticamente en cada UPDATE; esto tiene un costo
marginal de ~1ms por actualización. Aceptable dado el intervalo de 30–60s.

**Nota de validación:** el servicio de frontend debe rechazar lecturas con `accuracy > 50`
antes de llamar a este endpoint (PRD §7.5). La BD no valida la precisión — esa lógica
vive en la capa de aplicación.

---

### Q7 — Pedidos expirados pendientes de cierre (sistema)

**Feature:** background job que marca `EXPIRADO` los pedidos sin respuesta (PRD §7.6).
Ejecutada periódicamente (sugerido: cada 60s vía Supabase Edge Function + pg_cron).

```sql
UPDATE orders
SET status = 'EXPIRADO', updated_at = now()
WHERE
  status IN ('ENVIADO', 'RECIBIDO')
  AND expires_at < now()
RETURNING id;
```

**Índice:**

```sql
CREATE INDEX idx_orders_status_expires
  ON orders (status, expires_at)
  WHERE status IN ('ENVIADO', 'RECIBIDO');
```

**Por qué parcial:** los estados `ENVIADO` y `RECIBIDO` representan <1% de los pedidos
en un sistema maduro. Un índice parcial es mucho más pequeño que uno full.

---

## 3. EXPLAIN analysis — Q1 (geoquery crítica)

Los planes a continuación son prospectivos — muestran el comportamiento esperado
según la documentación de Postgres + PostGIS. Verificar con `EXPLAIN ANALYZE` real
una vez que haya datos de prueba en Supabase.

### Sin índice GIST (peor caso)

```
Seq Scan on stores  (cost=0.00..15420.00 rows=N width=...)
  Filter: (is_active AND ST_DWithin(location, ST_MakePoint($lon,$lat)::geography, $radius))
  Rows Removed by Filter: ~(total_stores - nearby_stores)
```

**Problema:** Postgres evalúa `ST_DWithin` para CADA fila de la tabla. A 10.000 tiendas
con ~50 activas en el radio → evalúa 9.950 filas inútilmente. Latencia estimada: 200–3000ms.

### Con índice GIST + partial index (caso optimizado)

```
Bitmap Heap Scan on stores  (cost=8.30..42.50 rows=12 width=...)
  Recheck Cond: (ST_DWithin(location, ST_MakePoint($lon,$lat)::geography, $radius))
  ->  BitmapAnd  (cost=8.30..8.30 rows=12 width=0)
        ->  Bitmap Index Scan on idx_stores_active_approved
              Index Cond: (is_active = true AND validation_status = 'approved')
        ->  Bitmap Index Scan on idx_stores_location_gist
              Index Cond: (ST_DWithin(location, ..., $radius))
```

**Resultado:** solo las filas que pasan ambos filtros llegan al heap scan.
Latencia estimada: 1–5ms a 10.000 tiendas.

---

## 4. PostGIS — configuración y uso

### Activación en Supabase

```sql
-- En el SQL Editor de Supabase — ya disponible, solo activar:
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verificar versión:
SELECT PostGIS_Full_Version();
```

### Tipo geography vs geometry

| | `geography` | `geometry` |
|---|---|---|
| **Sistema de referencia** | WGS-84 (esfera) | Plano cartesiano |
| **Unidades de ST_DWithin** | metros | unidades del SRS |
| **Precisión en áreas grandes** | alta | baja |
| **Velocidad** | ~10% más lento | más rápido |
| **Recomendación Ambulante** | ✅ usar | solo si performance es crítica y áreas son pequeñas |

Se elige `geography(Point, 4326)` porque:
1. Los radios de búsqueda se especifican en metros (PRD §7.1: default 2km).
2. La cobertura puede incluir ciudades en diferentes meridianos.
3. La diferencia de performance es irrelevante a escala MVP.

### Funciones PostGIS usadas

```sql
-- Crear un punto a partir de lon/lat
ST_MakePoint($lon, $lat)::geography

-- Filtrar por distancia (usa índice GIST)
ST_DWithin(location, reference_point, radius_meters)

-- Calcular distancia exacta (para ORDER BY)
ST_Distance(location, reference_point)

-- Serializar a GeoJSON para el cliente
ST_AsGeoJSON(location)::json
```

### Índice GIST — detalles

```sql
-- El índice GIST sobre geography usa una bounding box jerárquica (R-tree).
-- Soporta ST_DWithin, ST_Intersects, ST_Contains, etc.
CREATE INDEX idx_stores_location_gist
  ON stores USING GIST (location);

-- Verificar que el planner lo usa (buscar "Index Scan using idx_stores_location_gist"):
EXPLAIN SELECT * FROM stores
WHERE ST_DWithin(location, ST_MakePoint(-58.38, -34.60)::geography, 2000);
```

---

## 5. Row Level Security (RLS)

RLS en Postgres/Supabase garantiza el aislamiento de roles a nivel de BD
(PRD §7.3, §7.4, §9.4). Capa de seguridad adicional al middleware de la app.

```sql
-- Habilitar RLS en todas las tablas sensibles
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────
-- orders
-- ─────────────────────────────────────

-- Clientes ven solo sus propios pedidos
CREATE POLICY orders_client_select ON orders
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- Tiendas ven solo pedidos dirigidos a ellas
CREATE POLICY orders_store_select ON orders
  FOR SELECT TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- Admins ven todo
CREATE POLICY orders_admin_select ON orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─────────────────────────────────────
-- stores — visibilidad pública solo si approved + active
-- ─────────────────────────────────────
CREATE POLICY stores_public_select ON stores
  FOR SELECT
  USING (validation_status = 'approved');

-- Store owner ve y edita su propia tienda
CREATE POLICY stores_owner_all ON stores
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
```

**Nota de privacidad (PRD §7.2):** la ubicación exacta del cliente (`client_id`) nunca
se almacena en la BD — solo en el pedido como referencia de usuario. Las coords del
cliente al momento de pedir no se guardan en `orders`. La tienda solo conoce que
"hay un cliente que viene", sin coordenadas, hasta `ACEPTADO`.

---

## 6. Supabase Realtime — publicaciones

Para que Supabase Realtime propague cambios en <5s (PRD §7.2):

```sql
-- Habilitar replication para las tablas que necesitan realtime
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE stores;
```

**Qué escuchar en el cliente:**
- Canal `orders:store_id=eq.$store_id` → nuevos pedidos para la tienda (T5, T8)
- Canal `orders:id=eq.$order_id` → cambios de estado del pedido del cliente (C6, C8)
- Canal `stores:id=eq.$store_id` → actualización de ubicación de la tienda (mapa live)

---

## 7. Resumen de índices

| Índice | Tabla | Tipo | Queries |
|---|---|---|---|
| `idx_stores_location_gist` | stores | GIST | Q1 |
| `idx_stores_active_approved` | stores | BTree parcial | Q1 |
| `idx_orders_store_status_created` | orders | BTree | Q2 |
| `idx_orders_client_status_created` | orders | BTree | Q3, Q4 |
| `idx_products_store_active` | products | BTree parcial | Q5 |
| `idx_orders_status_expires` | orders | BTree parcial | Q7 |

---

## 8. Checklist de verificación pre-producción

Antes de lanzar el backend real, verificar:

- [ ] `CREATE EXTENSION postgis` ejecutado en el proyecto Supabase
- [ ] Todos los índices de §7 creados
- [ ] `EXPLAIN ANALYZE` de Q1 con datos de prueba confirma uso de `idx_stores_location_gist`
- [ ] RLS habilitado en `orders`, `stores`, `products`
- [ ] Test de aislamiento: usuario A no puede leer pedidos de usuario B
- [ ] Test de privacidad: tienda no recibe coords del cliente en ningún campo del pedido
- [ ] `supabase_realtime` publication configurada para `orders` y `stores`
- [ ] Paginación de Q4 verificada con >1000 pedidos (considerar cursor-based si hay lag)
- [ ] UPSERT de ubicación (Q6) testeado con frecuencia 30s bajo carga concurrente
