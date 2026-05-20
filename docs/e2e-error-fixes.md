# Correcciones E2E — guía de reemplazo

> Para cada error: nombre del archivo, número de línea, código ACTUAL (malo), código CORRECTO.
> Aplicá cada fix vos mismo copiando el bloque correcto sobre el incorrecto.

---

## ERRORES YA CORREGIDOS — no tocar

Estos errores del índice ya tienen fix en el código actual. Van a pasar en la próxima corrida sin cambios.

| Errores | Archivo | Motivo |
|---------|---------|--------|
| 38-40 | `e2e/auth.spec.ts` líneas 162, 167, 175 | Regex ya usa `/iniciar sesión\|ingresar/i` |
| 41-52 | `e2e/dark-mode.spec.ts` | Todos los `finally` ya tienen `.catch(() => {})` |
| 21 | `e2e/use-cases/04-admin/kpi-observabilidad.uc.spec.ts:31` | Ya tiene `.first()` después del `.or()` |
| 37 | Componente Hero | Ya usa `text-zinc-900` en lugar de `text-white` |
| 22-25 | `AdminModerationPage.goto()` | Ya espera `getByRole("main")` |
| 8-16 | `global-setup.ts` `resetApprovedStore()` | Ya setea `validation_status: "approved"` y `available: true` |
| 55 | `e2e/use-cases/01-auth/auth.uc.spec.ts:110` | Regex ya incluye `/incompleto\|enlace/i` |

---

## FIX 1 — Error 54

**Archivo:** `e2e/use-cases/page-objects/RegisterPage.ts`
**Línea:** 35

### Código actual (MALO)

```typescript
  get emailError() {
    return this.page.getByText(/email válido/i);
  }
```

### Código correcto

```typescript
  get emailError() {
    return this.page.getByText(/email válido|ya.*registrado|en uso|ya existe|email.*already|user.*registered|correo.*uso/i);
  }
```

**Por qué:** el getter original solo cubría el error de formato. Cuando el email ya existe en Supabase, la API devuelve un texto distinto que no matchea `/email válido/i`. La regex ampliada cubre ambos casos.

---

## FIX 2 — Error 26 (usuarios.uc.spec.ts strict mode)

**Archivo:** `e2e/use-cases/04-admin/usuarios.uc.spec.ts`
**Línea:** 12

### Código actual (MALO)

```typescript
    await expect(page.getByRole("table").or(page.getByRole("list"))).toBeVisible({
      timeout: 10_000,
    });
```

### Código correcto

```typescript
    await expect(page.getByRole("table").or(page.getByRole("list")).first()).toBeVisible({
      timeout: 10_000,
    });
```

**Por qué:** sin `.first()`, Playwright opera en strict mode y lanza error si hay más de un elemento que matchea (la página tiene un `<ul>` de navegación lateral Y una `<table>` de datos). `.first()` toma el primer match y evita la violación.

---

## ERRORES QUE NECESITAN INVESTIGACIÓN

Estos errores no tienen un fix de locator obvio — el código del test es correcto pero el entorno o los datos no están donde se espera. Tenés que correr los tests en modo headed para observar dónde fallan.

### Grupo A — Admin KPIs (Error 20)

**Archivo:** `e2e/use-cases/04-admin/kpi-observabilidad.uc.spec.ts:11`
**Locator que falla:** `getByTestId("kpi-active-stores")` con timeout de 20s

El componente renderiza ese test-id correctamente:
- `features/admin-kpi-dashboard/components/KpiCard/KpiCard.tsx:26` → `<Card data-testid={testId}>`
- `features/admin-kpi-dashboard/utils/kpi-dashboard.utils.ts:73` → `testId: "kpi-active-stores"`

Si el elemento no aparece en 20s, la causa más probable es que la query falla silenciosamente y el componente muestra `"No se pudieron cargar las métricas."` en lugar de las cards.

**Qué revisar:**
1. En Supabase Studio, verificar que el usuario admin puede leer las tablas `orders` y `stores` (revisar RLS policies).
2. Abrir `/admin/dashboard` en el browser con la sesión de admin y ver si los KPIs aparecen o si hay un mensaje de error.

---

### Grupo B — Admin usuarios: 'Ana García' no aparece (Errores 26-30)

**Archivo:** `e2e/use-cases/04-admin/usuarios.uc.spec.ts`
**Locator que falla:** `getByRole("row").filter({ hasText: "Ana García" })`

El nombre "Ana García" viene de `e2e/use-cases/fixtures/users.ts:11`:
```typescript
client: {
  email: "cliente@dev.ambulante.local",
  name: "Ana García",
}
```

Este usuario ES el cliente seed de `seed.sql`. Si la tabla de admin/users no muestra ese registro, las causas posibles son:
1. La columna `display_name` en la tabla `users` no está seteada (el trigger `on_auth_user_created` puede no copiar `user_metadata.display_name`).
2. La página `/admin/users` tiene paginación y el usuario no está en la primera página.
3. La query falla por RLS.

**Qué revisar en Supabase Studio:**
```sql
select auth_user_id, display_name from users where display_name ilike '%Ana%';
```
Si no devuelve nada, el problema está en el seed — el usuario existe en `auth.users` pero `display_name` está vacío en `public.users`.

---

### Grupo C — Admin stores: 'Empanadas La Porteña' no aparece (Errores 31-36, 56)

**Archivo:** `e2e/use-cases/04-admin/validacion-tiendas.uc.spec.ts`
**Locator que falla:** `getByRole("row").or(getByRole("listitem")).filter({ hasText: "Empanadas La Porteña" })`

El nombre viene de `e2e/use-cases/fixtures/stores.ts:20`:
```typescript
pending: {
  name: "Empanadas La Porteña",
```

El `global-setup.ts` la crea en `seedE2EOnlyUsers()` con `public_id: "50000000-0000-0000-0000-000000000001"`. Si no aparece en `/admin/stores`, las causas posibles son:
1. `seedE2EOnlyUsers()` falló silenciosamente — revisar los logs del `global-setup`.
2. La página `/admin/stores` filtra por estado y la pestaña "Pendientes" no está seleccionada por defecto.
3. La query falla por RLS.

**Qué revisar en Supabase Studio:**
```sql
select public_id, name, validation_status from stores where name ilike '%Porteña%';
```
Si devuelve la tienda, el problema es en el locator de la página (el tab de Pendientes no está activo). Si no devuelve nada, el seed falló.

---

### Grupo D — Submit del carrito no navega a `/orders/**` (Errores 1-7, 17-19, 53, 57-60)

**Este grupo es el más crítico — resolverlo elimina ~25 errores en cascada.**

**Archivos principales:**
- `e2e/use-cases/02-cliente/pedido-cliente.uc.spec.ts:28` — `page.waitForURL("**/orders/**")`
- `e2e/use-cases/page-objects/CartDrawer.ts:42-45` — `submitOrder()`

```typescript
async submitOrder() {
  await this.cartSummary.waitFor({ state: "visible", timeout: 5_000 });
  await this.submitButton.click();
}
```

El test espera que´ después de `submitOrder()` la URL cambie a `/orders/**`, pero esto no ocurre. Las causas más comunes son:

1. **La tienda no aparece en el mapa** porque `resetApprovedStore()` en `global-setup.ts` setea la ubicación como `POINT(-58.4328 -34.5779)`, pero el test en `pedido-cliente.uc.spec.ts:14-17` mockea la geolocalización del cliente con esas mismas coordenadas. Si el mapa no renderiza la tienda dentro del radio de búsqueda, `MapPage.openStoreDetail()` falla.

2. **El producto no existe** en el catálogo de la tienda — `global-setup.ts` no inserta productos; asume que `seed.sql` los tiene. Si el seed no cargó, el catálogo está vacío.

3. **El botón `cartSummary` no aparece en 5s** — el cajón del carrito puede no abrirse si el producto no se agregó.

**Cómo diagnosticar — correr en modo headed:**
```bash
pnpm test:e2e --headed --debug -g "UC-CLI-09"
```
1. Ver si la tienda aparece en el mapa (pin visible).
2. Ver si el botón del producto está en el catálogo.
3. Ver si al hacer click en "enviar pedido" el submit funciona y redirige.

**Estos errores son en cascada:** si `submitOrderAndLand()` falla, los errores 1-7, 17-19, 53 y 57-60 fallan todos por la misma causa.
