# Shared Registry

> **Índice vivo de todo lo reutilizable.** Antes de crear cualquier componente, hook, util, service, constante o tipo nuevo, **leé este archivo primero**. Si ya existe algo que sirve, reutilizalo o extendelo — nunca dupliques.
>
> **Regla de oro:** al agregar, modificar o eliminar algo en `shared/`, actualizar este archivo **en el mismo commit**.

---

## Cómo usar este archivo

1. **Antes de crear algo:** buscá acá (Ctrl+F) por nombre, propósito o categoría.
2. **Si existe y te sirve:** importalo con alias (`@/shared/...`).
3. **Si existe pero no encaja perfecto:** extendelo o generalizalo — no crees una versión paralela.
4. **Si no existe:** creálo, y agregá la entrada correspondiente acá.
5. **Si algo queda sin uso:** eliminarlo del código y del registry.

---

## Convención de entradas

Cada entrada sigue este formato:

```
### <Nombre>
- **Ruta:** `shared/<path>`
- **Descripción:** Una línea sobre qué hace.
- **API:** firma / props principales.
- **Usado en:** features/lugares donde se consume (para saber el impacto de cambiarlo).
```

---

## 1. Componentes UI (`shared/components/ui/`)

> Primitivas de shadcn/ui. Se añaden con `pnpm dlx shadcn@latest add <component>`.

*(vacío — agregar entradas a medida que se instalen)*

---

## 2. Componentes compuestos (`shared/components/`)

*(vacío)*

---

## 3. Hooks (`shared/hooks/`)

*(vacío — ejemplos previstos: `useGeolocation`, `useDebounce`, `useMediaQuery`, `useLocalStorage`)*

---

## 4. Services (`shared/services/`)

> Clientes de datos. Hoy devuelven mocks; mañana apuntarán a la API real. Los componentes consumen services, nunca mocks directos.

*(vacío — ejemplos previstos: `storesService`, `ordersService`, `authService`)*

---

## 5. Utils (`shared/utils/`)

> Funciones puras genéricas. Sin efectos secundarios.

*(vacío — ejemplos previstos: `formatDistance`, `haversine`, `formatCurrency`, `formatRelativeTime`)*

---

## 6. Styles (`shared/styles/`)

*(vacío — ejemplos previstos: `tokens.css`, `themes.ts`)*

---

## 7. Types (`shared/types/`)

> Tipos compartidos del dominio. Los tipos específicos de una feature van en su carpeta, no acá.

*(vacío — ejemplos previstos: `Order`, `OrderStatus`, `Store`, `Product`, `Client`, `Coordinates`)*

---

## 8. Constants (`shared/constants/`)

> Reemplazan magic strings / numbers. Todo lo de dominio con significado semántico.

*(vacío — ejemplos previstos: `ORDER_STATUS`, `USER_ROLES`, `GEO_REFRESH_INTERVAL_MS`, `ORDER_EXPIRATION_MINUTES`, `DEFAULT_SEARCH_RADIUS_KM`)*

---

## Changelog del registry

| Fecha | Cambio | Autor |
|---|---|---|
| 2026-04-15 | Creación del registry | — |
