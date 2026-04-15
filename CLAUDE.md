# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Ambulante — Product Requirements Document (PRD)

> **Tipo de producto:** Progressive Web App (PWA)
> **Categoría:** Coordinación de encuentros físicos en tiempo real
> **Estado:** Pre-desarrollo — definición de producto

---

## 1. Resumen ejecutivo

**Ambulante** es una PWA que conecta clientes con tiendas ambulantes (food trucks, puestos callejeros, vendedores móviles) mediante geolocalización en tiempo real. La aplicación no procesa pagos ni gestiona stock; actúa como **coordinador de intención de compra**, facilitando el encuentro físico entre oferta y demanda.

El diferencial central: **no es un marketplace transaccional**. Es una herramienta ligera que reduce la fricción de descubrimiento y coordinación, dejando la venta en el plano físico tradicional.

---

## 2. Contexto y problema

### 2.1 Problema del cliente
- No sabe qué tiendas ambulantes están operando cerca en este momento.
- Camina sin certeza de encontrar lo que busca.
- No tiene forma de "reservar" o anticipar que irá a comprar.

### 2.2 Problema de la tienda
- No puede anticipar demanda.
- No coordina encuentros con clientes interesados.
- Pierde ventas potenciales por falta de visibilidad.

### 2.3 Alcance explícito — qué NO se construye
- ❌ **Pasarela de pago** — la venta ocurre físicamente.
- ❌ **Stock en tiempo real** — la tienda también vende fuera de la app.
- ❌ **Rating/reviews en MVP** — foco en el flujo core primero.
- ❌ **Chat en vivo** — la coordinación se da por estados de pedido.

**Razón:** mantener la simplicidad operativa y evitar obligaciones regulatorias o carga operativa sobre vendedores ambulantes.

---

## 3. Objetivo del producto

> Reducir la fricción entre oferta y demanda en tiempo real, facilitando encuentros físicos entre clientes y tiendas ambulantes.

**Outcome medible:** incrementar la probabilidad de que un cliente interesado complete una compra física con una tienda ambulante cercana.

---

## 4. Usuarios y roles

| Rol | Descripción | Responsabilidades principales |
|---|---|---|
| **Cliente** | Usuario final que busca productos cercanos | Explorar mapa, enviar intención de compra, acudir al punto de encuentro |
| **Tienda** | Vendedor ambulante operando un puesto | Gestionar disponibilidad, aceptar/rechazar pedidos, confirmar finalización |
| **Administrador** | Staff de la plataforma | Validar tiendas, moderar contenido, resolver disputas |

---

## 5. Funcionalidades — MVP

### 5.1 Cliente

| ID | Feature | Descripción |
|---|---|---|
| C1 | Registro / login | Autenticación por email o proveedor social |
| C2 | Mapa de tiendas cercanas | Vista geolocalizada con tiendas activas dentro de un radio configurable |
| C3 | Detalle de tienda | Productos, precios, horario, ubicación actual |
| C4 | Selección de productos | Elegir items y cantidades para armar un pedido |
| C5 | Envío de intención de compra | Crear pedido asociado a una tienda |
| C6 | Seguimiento de estado | Ver en qué estado está el pedido (ver §6) |
| C7 | Historial de pedidos | Listado de pedidos previos con su resolución final |
| C8 | Notificaciones push | Alertas al cambiar el estado del pedido |

### 5.2 Tienda

| ID | Feature | Descripción |
|---|---|---|
| T1 | Registro / onboarding | Alta de tienda, validada por admin |
| T2 | Toggle de disponibilidad | Activar/desactivar visibilidad en el mapa |
| T3 | Gestión de catálogo | CRUD de productos (nombre, precio, foto, descripción) |
| T4 | Publicación de ubicación | Actualización periódica de geolocalización mientras está activa |
| T5 | Bandeja de pedidos entrantes | Lista de pedidos pendientes de respuesta |
| T6 | Aceptar / rechazar pedido | Acción explícita del vendedor |
| T7 | Marcar pedido como finalizado | Cierre manual tras el encuentro físico |
| T8 | Notificaciones push | Alertas cuando llega un pedido |

### 5.3 Administrador

| ID | Feature | Descripción |
|---|---|---|
| A1 | Panel de validación de tiendas | Aprobar/rechazar nuevas altas |
| A2 | Moderación de contenido | Revisar productos reportados, eliminar contenido inapropiado |
| A3 | Dashboard de métricas | Visualizar KPIs del §8 |

---

## 6. Estados del pedido (Máquina de estados)

```
  [ENVIADO] ──► [RECIBIDO] ──► [ACEPTADO] ──► [EN_CAMINO] ──► [FINALIZADO]
                     │              │
                     │              └──► [RECHAZADO]
                     └──► [CANCELADO]  (cliente cancela antes de recibido)
                     └──► [EXPIRADO]   (tienda no responde en ventana de tiempo)
```

### 6.1 Definición de estados

| Estado | Disparador | Actor | Transiciones válidas |
|---|---|---|---|
| `ENVIADO` | Cliente envía pedido | Cliente | → `RECIBIDO`, `CANCELADO`, `EXPIRADO` |
| `RECIBIDO` | Backend confirma entrega a la tienda | Sistema | → `ACEPTADO`, `RECHAZADO`, `EXPIRADO` |
| `ACEPTADO` | Tienda acepta | Tienda | → `EN_CAMINO`, `CANCELADO` |
| `RECHAZADO` | Tienda rechaza | Tienda | (terminal) |
| `EN_CAMINO` | Cliente confirma que va al punto | Cliente | → `FINALIZADO`, `CANCELADO` |
| `FINALIZADO` | Tienda confirma venta física | Tienda | (terminal) |
| `CANCELADO` | Cancelación manual | Cliente/Tienda | (terminal) |
| `EXPIRADO` | Timeout sin respuesta | Sistema | (terminal) |

### 6.2 Reglas de transición
- Solo el **actor autorizado** puede disparar la transición (p.ej. solo la tienda marca `FINALIZADO`).
- Todas las transiciones deben registrarse con timestamp para auditoría.
- Estados terminales son inmutables.

---

## 7. Consideraciones técnicas clave

### 7.1 Geolocalización
- **Cliente:** consulta de posición al abrir el mapa y al refrescar; radio configurable (default 2km).
- **Tienda:** reporta ubicación cada N segundos mientras `disponibilidad = activa`. Frecuencia sugerida: 30–60s.
- Precisión mínima aceptada: 50m. Descartar lecturas con mayor error.
- Respetar permisos del navegador; manejar el caso "permiso denegado" con fallback a búsqueda por dirección.

### 7.2 Tiempo real
- Las actualizaciones de estado de pedido y ubicación de tienda deben propagarse en <5s.
- Mecanismo recomendado: WebSockets o Server-Sent Events. Push notifications para app cerrada.

### 7.3 PWA
- Instalable en dispositivos móviles.
- Funcionalidad offline mínima: ver historial de pedidos previos.
- Service Worker para push notifications.

### 7.4 Autenticación y autorización
- Tres roles con permisos estrictamente separados.
- Una tienda nunca debe poder actuar sobre pedidos de otra tienda.
- Un cliente nunca debe poder modificar el estado que le corresponde a la tienda (y viceversa).

---

## 8. Métricas de éxito

| KPI | Definición | Target MVP |
|---|---|---|
| **Pedidos enviados / día** | Volumen de intenciones de compra creadas | Medir baseline |
| **Tasa de aceptación** | % de pedidos que pasan de `RECIBIDO` a `ACEPTADO` | ≥ 60% |
| **Tasa de finalización** | % de pedidos que llegan a `FINALIZADO` sobre los `ACEPTADO` | ≥ 70% |
| **Tiempo promedio de respuesta** | Delta entre `RECIBIDO` y `ACEPTADO`/`RECHAZADO` | < 3 min |
| **Tasa de expiración** | % de pedidos que llegan a `EXPIRADO` | < 15% |
| **Tiendas activas concurrentes** | Tiendas con `disponibilidad = activa` simultáneamente | Medir baseline |

---

## 9. Edge cases a contemplar

### 9.1 Geolocalización
- Cliente sin permiso de ubicación → ofrecer búsqueda manual por zona.
- Tienda pierde señal GPS → marcar como "ubicación desactualizada" si pasan >2min sin update.
- Cliente y tienda en zonas con GPS impreciso (urbano denso) → mostrar tolerancia de error.

### 9.2 Flujo de pedido
- Tienda desactiva disponibilidad con pedidos pendientes → auto-rechazar o forzar resolución previa.
- Cliente envía múltiples pedidos a la misma tienda → permitir, pero mostrar advertencia.
- Tienda nunca responde → timeout automático a `EXPIRADO` tras ventana configurable (sugerido 10 min).
- Tienda acepta pero nunca marca `FINALIZADO` → auto-cierre tras ventana (sugerido 2h) como `FINALIZADO` implícito o `EXPIRADO`.
- Cliente cancela después de `EN_CAMINO` → permitido, registrar motivo opcional.
- Producto eliminado del catálogo después de haber sido pedido → el pedido conserva snapshot del producto al momento de envío.

### 9.3 Concurrencia
- Dos acciones simultáneas sobre el mismo pedido (p.ej. cliente cancela mientras tienda acepta) → resolver por timestamp del servidor; la primera transición gana.
- Race condition en toggle de disponibilidad → la tienda debe ver feedback inmediato del estado real.

### 9.4 Datos y privacidad
- Ubicación exacta del cliente nunca debe exponerse a la tienda antes de `ACEPTADO`.
- Historial debe conservarse aunque la tienda elimine su cuenta (anonimizar referencias).

### 9.5 Moderación
- Tienda con contenido inapropiado → admin puede suspender; pedidos activos pasan a `CANCELADO`.
- Abuso de envío de pedidos falsos por parte del cliente → rate limiting y flag para revisión.

---

## 10. Supuestos

1. Los usuarios ambulantes tienen smartphone con conexión móvil estable durante sus turnos de trabajo.
2. Las tiendas están dispuestas a mantener la app abierta o recibir notificaciones push durante la operación.
3. La venta física siempre ocurre sin intervención de la plataforma — la plataforma no arbitra disputas de dinero.
4. El volumen inicial de usuarios permite operar sin infraestructura de alta escala.
5. La precisión de GPS del navegador es suficiente para encuentros físicos urbanos.
6. Los usuarios aceptan los términos de geolocalización compartida.
7. No existen requisitos regulatorios específicos del sector en la jurisdicción de lanzamiento inicial.

---

## 11. Riesgos del producto

| Riesgo | Impacto | Mitigación |
|---|---|---|
| **Baja adopción por parte de tiendas** | Alto — sin oferta no hay demanda | Onboarding asistido, cero costo, enfoque en zonas piloto |
| **Pedidos no finalizados por falta de compromiso** | Alto — erosiona confianza | Métricas de reputación futuras, recordatorios activos |
| **Ubicación imprecisa genera encuentros fallidos** | Medio | Mostrar margen de error, instrucciones claras del punto |
| **Tiendas no responden a tiempo** | Medio | Timeout automático, notificaciones agresivas |
| **Uso indebido (pedidos falsos, contenido inapropiado)** | Medio | Moderación, rate limiting, sistema de reporte |
| **Batería / datos móviles consumidos por geolocalización continua** | Medio | Frecuencia configurable, pausa automática |
| **Problemas de privacidad por exposición de ubicación** | Alto — legal y reputacional | Ocultar ubicación exacta del cliente hasta aceptación |
| **Dependencia de notificaciones push que algunos navegadores limitan (iOS Safari)** | Medio | Fallback a polling, educar al usuario sobre instalación PWA |

---

## 12. Posibles mejoras futuras

### 12.1 Producto
- **Sistema de reputación** bidireccional (cliente ↔ tienda).
- **Chat en vivo** para coordinar detalles del encuentro.
- **Favoritos y seguimiento** de tiendas recurrentes.
- **Notificaciones por proximidad**: avisar al cliente cuando una tienda favorita entra en su radio.
- **Programación anticipada**: reservar pedido para un horario futuro.
- **Rutas habituales de tiendas** con horarios predecibles.
- **Filtros por categoría** (comida, bebida, producto específico).

### 12.2 Negocio
- **Promociones y descuentos** publicables por la tienda.
- **Analytics para la tienda**: zonas de alta demanda, horarios pico.
- **Verificación de identidad** para tiendas (mayor confianza).
- **Modelo de monetización**: suscripción premium para tiendas con analytics avanzados (sin tocar la venta).

### 12.3 Técnico
- **Clustering en el mapa** para alta densidad de tiendas.
- **Predicción de demanda** con ML sobre históricos.
- **Modo offline completo** con sincronización diferida.
- **App nativa** si la PWA encuentra limitaciones en iOS.

---

## 13. Diferencial del producto

> **Ambulante no es un marketplace tradicional.**
> Es una herramienta de **coordinación de encuentros físicos** basada en **intención de compra en tiempo real**.
> El valor está en reducir incertidumbre, no en intermediar la transacción.

---

## Notas para desarrollo

- Este documento es la fuente de verdad del producto en su fase MVP.
- Cualquier feature fuera del alcance del §5 requiere discusión explícita antes de implementar.
- Las reglas de estados del §6 son **invariantes del sistema** — cualquier cambio debe actualizarse aquí primero.
- Priorizar **simplicidad operativa** sobre features: el producto compite por su baja fricción.
