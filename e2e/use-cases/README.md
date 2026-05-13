# Casos de Uso E2E — Ambulante

Cobertura completa de todos los flujos del sistema, organizados por actor.
Cada archivo `.uc.spec.ts` agrupa los casos de uso de una misma área.

---

## Estructura

```
e2e/use-cases/
├── fixtures/              # Seeds de datos: usuarios, tiendas, productos, pedidos
├── page-objects/          # Abstracciones de pantallas (POM)
├── 01-auth/               # Registro, login, recupero de contraseña
├── 02-cliente/            # Mapa, carrito, pedidos, perfil
├── 03-tienda/             # Onboarding, dashboard, catálogo, pedidos
├── 04-admin/              # Validación, usuarios, moderación, KPIs
└── 05-flujos-completos/   # Flujos cross-rol de principio a fin
```

---

## Prerequisitos

```bash
# Levantar Supabase local
pnpm supabase:start

# Correr seeds de E2E (usuarios, tiendas de prueba)
pnpm supabase:seed:e2e

# Levantar la app en el puerto E2E
pnpm build && pnpm start:e2e

# Correr todos los casos de uso
pnpm test:e2e --project=use-cases
```

## Variables de entorno necesarias

```env
# Cliente de prueba (UC-AUTH-03, flujos de cliente)
E2E_CLIENT_EMAIL=cliente@dev.ambulante.local
E2E_CLIENT_PASSWORD=Ambulante123!

# Tienda aprobada de prueba (flujos de tienda)
E2E_STORE_EMAIL=tienda@dev.ambulante.local
E2E_STORE_PASSWORD=Ambulante123!

# Tienda pendiente de aprobación
E2E_STORE_PENDING_EMAIL=tienda-pendiente@dev.ambulante.local
E2E_STORE_PENDING_PASSWORD=Ambulante123!

# Admin de prueba
E2E_ADMIN_EMAIL=admin@dev.ambulante.local
E2E_ADMIN_PASSWORD=Ambulante123!
```

---

## Índice de casos de uso

### AUTH
| ID | Nombre | Archivo |
|----|--------|---------|
| UC-AUTH-01 | Registro de cliente | 01-auth/auth.uc.spec.ts |
| UC-AUTH-02 | Registro de tienda (inicia onboarding) | 01-auth/auth.uc.spec.ts |
| UC-AUTH-03 | Login de cliente | 01-auth/auth.uc.spec.ts |
| UC-AUTH-04 | Login de tienda | 01-auth/auth.uc.spec.ts |
| UC-AUTH-05 | Login de admin | 01-auth/auth.uc.spec.ts |
| UC-AUTH-06 | Recupero de contraseña | 01-auth/auth.uc.spec.ts |
| UC-AUTH-07 | Reset de contraseña | 01-auth/auth.uc.spec.ts |
| UC-AUTH-08 | Redirect post-login según rol | 01-auth/auth.uc.spec.ts |
| UC-AUTH-09 | Bloqueo de rutas por rol incorrecto | 01-auth/auth.uc.spec.ts |

### CLIENTE
| ID | Nombre | Archivo |
|----|--------|---------|
| UC-CLI-01 | Ver mapa con tiendas cercanas | 02-cliente/mapa.uc.spec.ts |
| UC-CLI-02 | Ver tiendas en bottom sheet | 02-cliente/mapa.uc.spec.ts |
| UC-CLI-03 | Ver detalle de tienda | 02-cliente/mapa.uc.spec.ts |
| UC-CLI-04 | Agregar producto al carrito | 02-cliente/carrito.uc.spec.ts |
| UC-CLI-05 | Aumentar cantidad de un ítem | 02-cliente/carrito.uc.spec.ts |
| UC-CLI-06 | Disminuir cantidad de un ítem | 02-cliente/carrito.uc.spec.ts |
| UC-CLI-07 | Eliminar ítem del carrito | 02-cliente/carrito.uc.spec.ts |
| UC-CLI-08 | Vaciar carrito completo | 02-cliente/carrito.uc.spec.ts |
| UC-CLI-09 | Confirmar y enviar pedido | 02-cliente/pedido-cliente.uc.spec.ts |
| UC-CLI-10 | Ver tracking del pedido (ENVIADO) | 02-cliente/pedido-cliente.uc.spec.ts |
| UC-CLI-11 | Cancelar pedido en estado ENVIADO | 02-cliente/pedido-cliente.uc.spec.ts |
| UC-CLI-12 | Cancelar pedido en estado RECIBIDO | 02-cliente/pedido-cliente.uc.spec.ts |
| UC-CLI-13 | Confirmar que va en camino (EN_CAMINO) | 02-cliente/pedido-cliente.uc.spec.ts |
| UC-CLI-14 | Ver pedido en estado ACEPTADO | 02-cliente/pedido-cliente.uc.spec.ts |
| UC-CLI-15 | Ver pedido RECHAZADO por tienda | 02-cliente/pedido-cliente.uc.spec.ts |
| UC-CLI-16 | Ver pedido FINALIZADO | 02-cliente/pedido-cliente.uc.spec.ts |
| UC-CLI-17 | Ver historial de pedidos con filtros | 02-cliente/pedido-cliente.uc.spec.ts |
| UC-CLI-18 | Ver perfil de cliente | 02-cliente/perfil-cliente.uc.spec.ts |
| UC-CLI-19 | Editar perfil de cliente | 02-cliente/perfil-cliente.uc.spec.ts |

### TIENDA
| ID | Nombre | Archivo |
|----|--------|---------|
| UC-STO-01 | Onboarding paso 1: datos fiscales (CUIT) | 03-tienda/onboarding.uc.spec.ts |
| UC-STO-02 | Onboarding paso 2: zona de cobertura | 03-tienda/onboarding.uc.spec.ts |
| UC-STO-03 | Onboarding paso 3: horarios de operación | 03-tienda/onboarding.uc.spec.ts |
| UC-STO-04 | Validación CUIT con dígito verificador inválido | 03-tienda/onboarding.uc.spec.ts |
| UC-STO-05 | Ver pantalla de espera de aprobación (pending) | 03-tienda/onboarding.uc.spec.ts |
| UC-STO-06 | Ver pantalla de rechazo con motivo | 03-tienda/onboarding.uc.spec.ts |
| UC-STO-07 | Ver dashboard de tienda aprobada | 03-tienda/dashboard.uc.spec.ts |
| UC-STO-08 | Activar disponibilidad de tienda | 03-tienda/dashboard.uc.spec.ts |
| UC-STO-09 | Desactivar disponibilidad de tienda | 03-tienda/dashboard.uc.spec.ts |
| UC-STO-10 | Opt-in de notificaciones push | 03-tienda/dashboard.uc.spec.ts |
| UC-STO-11 | Ver catálogo de productos | 03-tienda/catalogo.uc.spec.ts |
| UC-STO-12 | Crear producto (sin imagen) | 03-tienda/catalogo.uc.spec.ts |
| UC-STO-13 | Crear producto con imagen | 03-tienda/catalogo.uc.spec.ts |
| UC-STO-14 | Editar producto existente | 03-tienda/catalogo.uc.spec.ts |
| UC-STO-15 | Eliminar producto del catálogo | 03-tienda/catalogo.uc.spec.ts |
| UC-STO-16 | Validaciones del formulario de producto | 03-tienda/catalogo.uc.spec.ts |
| UC-STO-17 | Ver pedidos entrantes | 03-tienda/pedidos-tienda.uc.spec.ts |
| UC-STO-18 | Aceptar pedido | 03-tienda/pedidos-tienda.uc.spec.ts |
| UC-STO-19 | Rechazar pedido | 03-tienda/pedidos-tienda.uc.spec.ts |
| UC-STO-20 | Finalizar pedido (cliente en camino) | 03-tienda/pedidos-tienda.uc.spec.ts |
| UC-STO-21 | Cancelar pedido en estado ACEPTADO | 03-tienda/pedidos-tienda.uc.spec.ts |
| UC-STO-22 | Ver perfil de tienda | 03-tienda/dashboard.uc.spec.ts |
| UC-STO-23 | Editar perfil de tienda | 03-tienda/dashboard.uc.spec.ts |
| UC-STO-24 | Ver analytics de tienda | 03-tienda/dashboard.uc.spec.ts |

### ADMIN
| ID | Nombre | Archivo |
|----|--------|---------|
| UC-ADM-01 | Ver dashboard de admin con KPIs | 04-admin/kpi-observabilidad.uc.spec.ts |
| UC-ADM-02 | Listar tiendas pendientes de validación | 04-admin/validacion-tiendas.uc.spec.ts |
| UC-ADM-03 | Ver detalle de tienda para validar | 04-admin/validacion-tiendas.uc.spec.ts |
| UC-ADM-04 | Aprobar tienda | 04-admin/validacion-tiendas.uc.spec.ts |
| UC-ADM-05 | Rechazar tienda con motivo (mín 10 chars) | 04-admin/validacion-tiendas.uc.spec.ts |
| UC-ADM-06 | Buscar tiendas por nombre | 04-admin/validacion-tiendas.uc.spec.ts |
| UC-ADM-07 | Listar todos los usuarios | 04-admin/usuarios.uc.spec.ts |
| UC-ADM-08 | Filtrar usuarios por rol | 04-admin/usuarios.uc.spec.ts |
| UC-ADM-09 | Ver detalle de usuario con historial de pedidos | 04-admin/usuarios.uc.spec.ts |
| UC-ADM-10 | Suspender usuario activo | 04-admin/usuarios.uc.spec.ts |
| UC-ADM-11 | Reactivar usuario suspendido | 04-admin/usuarios.uc.spec.ts |
| UC-ADM-12 | Ver cola de moderación de contenido | 04-admin/moderacion.uc.spec.ts |
| UC-ADM-13 | Dismiss de reporte (contenido OK) | 04-admin/moderacion.uc.spec.ts |
| UC-ADM-14 | Remover contenido reportado | 04-admin/moderacion.uc.spec.ts |
| UC-ADM-15 | Ver listado general de pedidos | 04-admin/kpi-observabilidad.uc.spec.ts |
| UC-ADM-16 | Ver audit log de transiciones de un pedido | 04-admin/kpi-observabilidad.uc.spec.ts |
| UC-ADM-17 | Ver métricas de observabilidad (slow queries) | 04-admin/kpi-observabilidad.uc.spec.ts |

### FLUJOS COMPLETOS (cross-rol)
| ID | Nombre | Archivo |
|----|--------|---------|
| UC-FLOW-01 | Happy path: pedido enviado → finalizado | 05-flujos-completos/happy-path.uc.spec.ts |
| UC-FLOW-02 | Pedido rechazado por tienda | 05-flujos-completos/pedido-rechazado.uc.spec.ts |
| UC-FLOW-03 | Pedido cancelado por cliente en ENVIADO | 05-flujos-completos/pedido-cancelado.uc.spec.ts |
| UC-FLOW-04 | Pedido cancelado por tienda en ACEPTADO | 05-flujos-completos/pedido-cancelado.uc.spec.ts |
| UC-FLOW-05 | Pedido expirado sin respuesta (cron) | 05-flujos-completos/pedido-expirado.uc.spec.ts |
| UC-FLOW-06 | Alta completa de tienda + validación admin | 05-flujos-completos/alta-tienda-completa.uc.spec.ts |
