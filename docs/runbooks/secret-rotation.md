# Runbook: Secret Rotation — Ambulante

> **Audiencia:** desarrolladores con acceso al proveedor de hosting (Vercel) y a las cuentas de servicios externos (Sentry, proveedor de tiles).
> **Última revisión:** 2026-04-20

---

## 1. Inventario de secrets

| Variable | Dónde vive | Expuesto al browser | Proveedor |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Vercel env vars | Sí | N/A — URL propia |
| `NEXT_PUBLIC_SENTRY_DSN` | Vercel env vars | Sí | sentry.io |
| `SENTRY_DSN` | Vercel env vars | No (solo servidor) | sentry.io |
| `SENTRY_AUTH_TOKEN` | Vercel env vars | No | sentry.io |
| `NEXT_PUBLIC_MAP_STYLE_URL` | Vercel env vars | Sí | Tile server propio o Protomaps |

> `NEXT_PUBLIC_*` se embebe en el bundle del cliente. No incluyen secrets de alta sensibilidad; su rotación es preventiva.
> `SENTRY_AUTH_TOKEN` es el de mayor sensibilidad: permite subir source maps y acceder al proyecto en Sentry.

---

## 2. Cuándo rotar

### 2.1 Rotación preventiva (planificada)

- Cada 90 días para `SENTRY_AUTH_TOKEN`.
- Al offboarding de cualquier miembro del equipo con acceso a los proveedores.
- Antes de hacer público el repositorio si alguna variable estuvo hardcodeada en algún commit histórico.

### 2.2 Rotación de emergencia (incidente)

Rotar **inmediatamente** si:

- El secret aparece en un commit, PR, log de CI, o mensaje de Slack/Discord.
- Un dispositivo con acceso al `.env.local` es comprometido o perdido.
- Un miembro del equipo deja la organización de forma no planificada.
- Sentry o el tile server reportan actividad anómala en el proyecto.

---

## 3. Procedimiento de rotación

### 3.1 `SENTRY_AUTH_TOKEN`

1. Ir a **sentry.io → Settings → Auth Tokens**.
2. Crear un nuevo token con los mismos scopes que el token actual (típicamente `project:releases`, `org:read`).
3. Copiar el nuevo token.
4. En **Vercel → Project → Settings → Environment Variables**, actualizar `SENTRY_AUTH_TOKEN` con el nuevo valor en todos los entornos (Production, Preview, Development).
5. Revocar el token anterior en sentry.io.
6. Disparar un redeploy manual en Vercel para que el nuevo token esté activo.
7. Verificar que el próximo deploy de producción suba source maps sin errores (revisar logs del build step "Upload source maps").

### 3.2 `NEXT_PUBLIC_SENTRY_DSN` y `SENTRY_DSN`

> El DSN no es un secret de autenticación sino un identificador de proyecto. La rotación se hace regenerando el DSN en Sentry.

1. Ir a **sentry.io → Settings → Projects → [proyecto] → Client Keys (DSN)**.
2. Crear una nueva Client Key.
3. Actualizar `NEXT_PUBLIC_SENTRY_DSN` y `SENTRY_DSN` en Vercel con el nuevo DSN.
4. Deshabilitar (no borrar aún) la Client Key anterior en Sentry.
5. Redeploy en Vercel.
6. Verificar que los errores llegan correctamente a Sentry desde producción (enviar un error de prueba o esperar el primer error real).
7. Una vez confirmado que el nuevo DSN funciona (mínimo 24 h), revocar la Client Key anterior.

### 3.3 `NEXT_PUBLIC_MAP_STYLE_URL`

> Si el tile server usa autenticación por URL token (ej. Protomaps API key embebida en la URL):

1. Generar una nueva URL/token en el dashboard del proveedor de tiles.
2. Actualizar `NEXT_PUBLIC_MAP_STYLE_URL` en Vercel.
3. Revocar la URL/token anterior en el proveedor.
4. Redeploy y verificar que el mapa carga en producción.

> Si el tile server es self-hosted (demotiles de MapLibre, servidor propio), no hay token que rotar; solo actualizar la URL si cambia el endpoint.

### 3.4 `NEXT_PUBLIC_APP_URL`

No es un secret — es la URL pública de la app. Solo se modifica si el dominio cambia. No aplica rotación periódica.

---

## 4. Checklist de verificación post-rotación

Completar todos los ítems antes de cerrar el incidente o la tarea de rotación planificada:

- [ ] El nuevo secret está activo en Vercel (Production + Preview + Development según aplique).
- [ ] El secret anterior fue revocado en el proveedor.
- [ ] El redeploy de producción completó sin errores de build.
- [ ] El servicio afectado funciona correctamente en producción (logs, monitoreo).
- [ ] El `.env.example` en el repositorio refleja correctamente las variables (sin valores reales, solo placeholders).
- [ ] Ningún miembro del equipo tiene el valor anterior guardado en su `.env.local` — comunicar la rotación al equipo para que actualicen su entorno local.
- [ ] Si fue rotación de emergencia: documentar en el canal del equipo la causa raíz y la fecha/hora de rotación.

---

## 5. Acceso y responsabilidades

| Acción | Quién puede ejecutarla |
|---|---|
| Crear/revocar tokens en Sentry | Owner o Admin del proyecto en sentry.io |
| Actualizar variables en Vercel | Owner o miembro con rol Editor en el proyecto Vercel |
| Comunicar rotación al equipo | Quien ejecuta la rotación |

> Principio de mínimo privilegio: los tokens de CI/CD (ej. `SENTRY_AUTH_TOKEN` usado en build) deben tener solo los scopes necesarios para su función, no scopes de admin.

---

## 6. Fuera del alcance de este runbook

- Rotación de credenciales de base de datos (Supabase) — cuando se implemente el backend, crear `docs/runbooks/supabase-credentials.md`.
- Gestión de claves de API de pago — Ambulante MVP no procesa pagos (PRD §2.3).
- Rotación de certificados TLS — gestionados automáticamente por Vercel.
