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
-- product_snapshot preserva el estado del producto al momento del pedido (PRD §7.4).
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
-- Audit log de cada transición de estado (PRD §7.1: "Toda transición registra timestamp").
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
  o.id,
  o.client_id,
  o.status,
  o.expires_at,
  o.created_at,
  o.updated_at,
  json_agg(
    json_build_object(
      'id',       oi.id,
      'quantity', oi.quantity,
      'snapshot', oi.product_snapshot
    )
  ) AS items
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE
  o.store_id = $store_id
  AND o.status NOT IN ('FINALIZADO', 'RECHAZADO', 'CANCELADO', 'EXPIRADO')
GROUP BY o.id
ORDER BY o.created_at DESC;
```

**Por qué columnas explícitas:** `SELECT o.*` incluiría cualquier campo nuevo que se añada
a `orders` en el futuro (e.g. campos internos de admin). Proyectar columnas explícitas
garantiza que la tienda solo ve lo que necesita.

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

**Nota sobre `SELECT o.*`:** aquí el cliente está leyendo su propio pedido — `o.*` incluye
`client_id` que es el propio UID. RLS garantiza que solo accede a sus filas.
Si se añaden campos internos (e.g. flags de moderación) en el futuro, proyectar
columnas explícitas antes de exponer en la API pública.

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

**Nota sobre OFFSET:** En MVP con historial pequeño, OFFSET es aceptable.
Para paginación a escala, usar cursor compuesto `(created_at, id)` para evitar el
full index scan que genera `OFFSET N`:

```sql
-- Cursor-based: página siguiente a partir del último ítem visto
SELECT o.*, s.name AS store_name
FROM orders o
JOIN stores s ON s.id = o.store_id
WHERE o.client_id = $client_id
  AND (o.created_at, o.id) < ($cursor_created_at, $cursor_id)
ORDER BY o.created_at DESC, o.id DESC
LIMIT 20;
```

El cursor compuesto `(created_at, id)` garantiza unicidad — evita el salto de filas
cuando dos pedidos tienen el mismo `created_at`.

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

### Q5b — Índices de soporte en tablas de join

Las tablas `order_items` y `order_transitions` se acceden siempre por `order_id`.
Sin índices, cada join genera un Seq Scan.

```sql
CREATE INDEX idx_order_items_order_id
  ON order_items (order_id);

CREATE INDEX idx_order_transitions_order_id
  ON order_transitions (order_id);
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
WHERE id = $store_id
  AND is_active = true
  AND validation_status = 'approved';
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
-- FOR UPDATE SKIP LOCKED requiere CTE — no es válido dentro de IN (subquery) en Postgres 15
WITH locked AS (
  SELECT id, CLOCK_TIMESTAMP() AS ts FROM orders
  WHERE
    status IN ('ENVIADO', 'RECIBIDO')
    AND expires_at < CLOCK_TIMESTAMP()
  FOR UPDATE SKIP LOCKED
)
UPDATE orders
SET status = 'EXPIRADO', updated_at = locked.ts
FROM locked
WHERE orders.id = locked.id
RETURNING orders.id;
```

**Índice:**

```sql
CREATE INDEX idx_orders_status_expires
  ON orders (status, expires_at)
  WHERE status IN ('ENVIADO', 'RECIBIDO');
```

**Por qué parcial:** los estados `ENVIADO` y `RECIBIDO` representan <1% de los pedidos
en un sistema maduro. Un índice parcial es mucho más pequeño que uno full.

**Por qué `FOR UPDATE SKIP LOCKED`:** si dos instancias del job corren en paralelo
(e.g. Edge Functions concurrentes), `SKIP LOCKED` evita que ambas actualicen el mismo
pedido — cada instancia trabaja sobre un subconjunto disjunto de filas bloqueadas.

**Por qué `CLOCK_TIMESTAMP()` y no `now()`:** `now()` devuelve el timestamp al inicio
de la transacción y permanece fijo durante toda ella. `CLOCK_TIMESTAMP()` devuelve el
tiempo real del reloj en el momento de evaluación — más preciso para comparar
`expires_at` en una transacción que puede procesar muchas filas.

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

**Nota — BitmapAnd es decisión del planner:** el plan mostrado arriba es el óptimo
esperado, pero el planner puede elegir un único index scan si sus estimaciones de costo
lo favorecen (e.g. tabla pequeña o estadísticas desactualizadas). Ejecutar
`ANALYZE stores;` después de cargar datos de prueba para que el planner disponga de
estadísticas actuales. Verificar que `BitmapAnd` aparece en el plan real con
`EXPLAIN (ANALYZE, BUFFERS) SELECT ...` antes de dar por buena la optimización.

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

> **Advertencia de orden de parámetros:** `ST_MakePoint` recibe `(longitude, latitude)`,
> **no** `(latitude, longitude)`. Invertirlos es silencioso — no hay error, pero todas
> las coordenadas quedan transpuestas. Siempre pasar `$lon` primero.

```sql
-- Crear un punto a partir de lon/lat  →  ST_MakePoint(LONGITUD, LATITUD)
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
(PRD §7.3 — roles aislados; §7.4 — snapshot de productos). Capa de seguridad
adicional al middleware de la app. La privacidad de ubicación del cliente (PRD §7.2)
se garantiza por diseño de schema — no se almacenan las coords del cliente —,
no por RLS.

```sql
-- Habilitar RLS en TODAS las tablas sensibles
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_transitions ENABLE ROW LEVEL SECURITY;
-- users: tabla de aplicación con role 'client'|'store_owner'|'admin'.
-- Se sincroniza con auth.users vía trigger (mismo UUID como PK).
-- RLS sobre users: Supabase Auth la gestiona — no se duplica aquí.
-- Acceso a users desde otras políticas vía EXISTS/IN es seguro: el planner
-- no expone rows que el rol no puede ver porque se ejecuta con SECURITY DEFINER.

-- ─────────────────────────────────────
-- orders — SELECT
-- ─────────────────────────────────────

-- Clientes ven solo sus propios pedidos
CREATE POLICY orders_client_select ON orders
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- Tiendas ven solo pedidos dirigidos a ellas
CREATE POLICY orders_store_select ON orders
  FOR SELECT TO authenticated
  USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- Admins ven todo
CREATE POLICY orders_admin_select ON orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─────────────────────────────────────
-- orders — INSERT / UPDATE
-- ─────────────────────────────────────

-- Solo el cliente crea un pedido para sí mismo
CREATE POLICY orders_client_insert ON orders
  FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

-- La tienda actualiza estado en sus pedidos (ACEPTADO, RECHAZADO, FINALIZADO)
CREATE POLICY orders_store_update ON orders
  FOR UPDATE TO authenticated
  USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

-- El cliente actualiza estado en sus pedidos (CANCELADO, EN_CAMINO)
CREATE POLICY orders_client_update ON orders
  FOR UPDATE TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- El sistema (service_role) actualiza sin restricciones — bypasea RLS por definición
-- de Supabase al usar la clave service_role. No se define política explícita.

-- Pedidos no se borran (estados terminales son inmutables, §7.1).
-- Sin política DELETE → ningún rol authenticated puede borrar.

-- ─────────────────────────────────────
-- stores — visibilidad pública solo si approved + active
-- ─────────────────────────────────────

-- Cualquier usuario (incluso anon) ve tiendas aprobadas y activas
CREATE POLICY stores_public_select ON stores
  FOR SELECT TO anon, authenticated
  USING (validation_status = 'approved' AND is_active = true);

-- Store owner ve su propia tienda en cualquier estado (pending, rejected, inactive)
CREATE POLICY stores_owner_select ON stores
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- Store owner crea su tienda — siempre en estado 'pending'
CREATE POLICY stores_owner_insert ON stores
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND validation_status = 'pending');

-- Store owner edita su tienda. validation_status es protegido por trigger (ver abajo).
CREATE POLICY stores_owner_update ON stores
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Admins ven y editan todo (incluyendo cambiar validation_status)
CREATE POLICY stores_admin_all ON stores
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
```

**Advertencia — DELETE en stores con pedidos activos:** la política `stores_admin_all`
incluye DELETE. La FK `orders.store_id REFERENCES stores(id)` sin `ON DELETE CASCADE`
causará un error de FK si existen pedidos en estados no-terminales al borrar la tienda.
La lógica de admin debe verificar `COUNT(*) FROM orders WHERE store_id = $id AND status NOT IN
('FINALIZADO', 'RECHAZADO', 'CANCELADO', 'EXPIRADO')` antes de eliminar.

**Protección de `validation_status` contra auto-aprobación:**
RLS no puede restringir columnas individuales en un UPDATE. Se requiere un trigger:

```sql
-- Trigger que previene que el owner cambie validation_status ni active
-- una tienda no aprobada sin intervención de admin
CREATE OR REPLACE FUNCTION prevent_owner_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  is_admin boolean;
BEGIN
  is_admin := EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin');

  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- El owner no puede cambiar validation_status (auto-aprobación)
  NEW.validation_status := OLD.validation_status;

  -- El owner no puede activar (is_active = true) una tienda no aprobada
  -- Previene que tiendas pending/rejected aparezcan en el mapa
  IF NEW.is_active = true AND OLD.validation_status != 'approved' THEN
    NEW.is_active := OLD.is_active;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_validation_status
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION prevent_owner_approval();
```

**Cumplimiento de la máquina de estados en `orders.status` (PRD §7.1):**
RLS no puede restringir qué valor se escribe en `status`. Sin un trigger, cualquier
actor autenticado con acceso UPDATE podría saltar a cualquier estado. Se requiere
un trigger que valide la transición contra el rol del actor:

```sql
-- Trigger que aplica la máquina de estados del pedido
-- Transiciones válidas por actor (PRD §7.1 / CLAUDE.md §7.1):
--   Cliente:  ENVIADO (insert), CANCELADO (pre-ACEPTADO), EN_CAMINO
--   Tienda:   ACEPTADO, RECHAZADO, FINALIZADO
--   Sistema:  RECIBIDO, EXPIRADO  → via service_role (bypasea trigger)
CREATE OR REPLACE FUNCTION enforce_order_status_transition()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  actor_role text;
  is_store_owner boolean;
BEGIN
  -- Estados terminales son inmutables — nadie, ni admin ni sistema, puede reabrirlos (PRD §7.1)
  IF OLD.status IN ('FINALIZADO', 'RECHAZADO', 'CANCELADO', 'EXPIRADO') THEN
    RAISE EXCEPTION 'El pedido está en estado terminal (%) y no puede cambiar', OLD.status;
  END IF;

  -- El sistema (pg_cron / Edge Function con service_role) no tiene JWT.
  -- Solo se permiten las dos transiciones legítimas del sistema (PRD §7.1).
  -- Cualquier otra transición sin actor autenticado es rechazada explícitamente
  -- para evitar que sesiones directas (psql, superuser) salten el estado.
  IF auth.uid() IS NULL THEN
    IF NEW.status IN ('RECIBIDO', 'EXPIRADO') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Transición % → % requiere actor autenticado', OLD.status, NEW.status;
  END IF;

  SELECT role INTO actor_role FROM users WHERE id = auth.uid();

  -- Admins pueden forzar transiciones válidas (operaciones manuales de soporte).
  -- La guardia de estados terminales de arriba aplica también a admins.
  IF actor_role = 'admin' THEN
    RETURN NEW;
  END IF;

  is_store_owner := EXISTS (
    SELECT 1 FROM stores WHERE id = NEW.store_id AND owner_id = auth.uid()
  );

  -- Transiciones permitidas por tienda
  IF is_store_owner THEN
    IF OLD.status = 'RECIBIDO'  AND NEW.status = 'ACEPTADO'   THEN RETURN NEW; END IF;
    IF OLD.status = 'RECIBIDO'  AND NEW.status = 'RECHAZADO'  THEN RETURN NEW; END IF;
    IF OLD.status = 'ACEPTADO'  AND NEW.status = 'FINALIZADO' THEN RETURN NEW; END IF;
    RAISE EXCEPTION 'Transición % → % no permitida para la tienda', OLD.status, NEW.status;
  END IF;

  -- Transiciones permitidas por cliente
  IF NEW.client_id = auth.uid() THEN
    IF OLD.status = 'ENVIADO'  AND NEW.status = 'CANCELADO'  THEN RETURN NEW; END IF;
    IF OLD.status = 'RECIBIDO' AND NEW.status = 'CANCELADO'  THEN RETURN NEW; END IF;
    IF OLD.status = 'ACEPTADO' AND NEW.status = 'EN_CAMINO'  THEN RETURN NEW; END IF;
    RAISE EXCEPTION 'Transición % → % no permitida para el cliente', OLD.status, NEW.status;
  END IF;

  RAISE EXCEPTION 'Actor sin permisos para actualizar este pedido';
END;
$$;

CREATE TRIGGER check_order_status_transition
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION enforce_order_status_transition();
```

```sql
-- ─────────────────────────────────────
-- products
-- ─────────────────────────────────────

-- Cualquier usuario ve productos activos de tiendas aprobadas y activas
CREATE POLICY products_public_select ON products
  FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND store_id IN (
      SELECT id FROM stores
      WHERE validation_status = 'approved' AND is_active = true
    )
  );

-- Store owner gestiona sus propios productos
CREATE POLICY products_owner_all ON products
  FOR ALL TO authenticated
  USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

-- ─────────────────────────────────────
-- order_items — acoplado al pedido
-- ─────────────────────────────────────

-- Hereda visibilidad del pedido: cliente ve sus ítems, tienda ve los de sus pedidos
CREATE POLICY order_items_client_select ON order_items
  FOR SELECT TO authenticated
  USING (
    order_id IN (SELECT id FROM orders WHERE client_id = auth.uid())
  );

CREATE POLICY order_items_store_select ON order_items
  FOR SELECT TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN stores s ON s.id = o.store_id
      WHERE s.owner_id = auth.uid()
    )
  );

CREATE POLICY order_items_admin_select ON order_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Solo el cliente inserta ítems al crear el pedido
CREATE POLICY order_items_client_insert ON order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE client_id = auth.uid())
  );

-- order_items no se modifican ni borran — el snapshot es inmutable (§7.4).

-- ─────────────────────────────────────
-- order_transitions — audit log
-- ─────────────────────────────────────

-- Mismo acceso que el pedido base: quien ve el pedido, ve su historial de estados
CREATE POLICY order_transitions_client_select ON order_transitions
  FOR SELECT TO authenticated
  USING (
    order_id IN (SELECT id FROM orders WHERE client_id = auth.uid())
  );

CREATE POLICY order_transitions_store_select ON order_transitions
  FOR SELECT TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN stores s ON s.id = o.store_id
      WHERE s.owner_id = auth.uid()
    )
  );

CREATE POLICY order_transitions_admin_select ON order_transitions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Insertar transiciones — actor debe ser el usuario autenticado
-- Y debe ser parte del pedido (cliente o dueño de la tienda del pedido)
-- El sistema usa service_role (bypasea RLS) para inserciones sin actor humano (EXPIRADO).
CREATE POLICY order_transitions_insert ON order_transitions
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND (
      order_id IN (SELECT id FROM orders WHERE client_id = auth.uid())
      OR
      order_id IN (
        SELECT o.id FROM orders o
        JOIN stores s ON s.id = o.store_id
        WHERE s.owner_id = auth.uid()
      )
    )
  );

-- Las transiciones son inmutables — sin UPDATE ni DELETE.
-- Admins y el sistema usan service_role para operaciones fuera del flujo normal.
```

**Nota de privacidad (PRD §7.2):** la ubicación exacta del cliente no se almacena
en `orders`. La tienda solo conoce que "hay un cliente que viene", sin coordenadas,
hasta `ACEPTADO`.

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
| `idx_order_items_order_id` | order_items | BTree | Q2, joins |
| `idx_order_transitions_order_id` | order_transitions | BTree | joins |
| `idx_orders_status_expires` | orders | BTree parcial | Q7 |

---

## 8. Checklist de verificación pre-producción

Antes de lanzar el backend real, verificar:

- [ ] `CREATE EXTENSION postgis` ejecutado en el proyecto Supabase
- [ ] Todos los índices de §7 creados (incluye `idx_order_items_order_id` y `idx_order_transitions_order_id`)
- [ ] `ANALYZE stores;` ejecutado con datos de prueba antes de verificar planes EXPLAIN
- [ ] `EXPLAIN (ANALYZE, BUFFERS)` de Q1 confirma uso de `idx_stores_location_gist` + BitmapAnd
- [ ] RLS habilitado en `orders`, `stores`, `products`, `order_items`, `order_transitions`
- [ ] Trigger `enforce_validation_status` activo — verificar que owner no puede auto-aprobarse
- [ ] Test de aislamiento: usuario A no puede leer pedidos de usuario B
- [ ] Test de aislamiento: usuario anon no puede ver tiendas pending/rejected
- [ ] Test de privacidad: tienda no recibe coords del cliente en ningún campo del pedido
- [ ] Test de products RLS: anon ve catálogo de tienda approved; no ve tienda pending
- [ ] `supabase_realtime` publication configurada para `orders` y `stores`
- [ ] Paginación de Q4 verificada con >1000 pedidos (usar cursor-based si hay lag)
- [ ] UPSERT de ubicación (Q6) testeado con frecuencia 30s bajo carga concurrente
- [ ] Q7 con `FOR UPDATE SKIP LOCKED` testeado con dos workers concurrentes
- [ ] `EXPLAIN ANALYZE` de Q7 confirma uso de `idx_orders_status_expires` (no Seq Scan)
- [ ] Trigger `check_order_status_transition` testeado: cliente no puede escribir `FINALIZADO`, tienda no puede escribir `EN_CAMINO`
- [ ] Test de inmutabilidad de terminales: pedido `FINALIZADO` o `RECHAZADO` no puede cambiar de estado por ningún actor
- [ ] Test `prevent_owner_approval`: owner no puede activar (`is_active = true`) una tienda con `validation_status != 'approved'`
- [ ] Al exponer Q3 en la API pública, proyectar columnas explícitas (no `SELECT o.*`) para evitar exponer campos internos futuros
