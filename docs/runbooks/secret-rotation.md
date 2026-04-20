# Runbook: Secret Rotation — Ambulante

> **Audiencia:** desarrolladores con acceso al proveedor de hosting (Vercel) y a las cuentas de servicios externos (Sentry, proveedor de tiles).
> **Última revisión:** 2026-04-20

---

## 1. Inventario de secrets

| Variable | Dónde vive | Expuesto al browser | Proveedor | En runtime schema |
|---|---|---|---|---|
| `NODE_ENV` | Vercel env vars | No | N/A | Sí — valor fijo `"production"` en producción. No requiere rotación. |
| `NEXT_PUBLIC_APP_URL` | Vercel env vars | Sí | N/A — URL propia | Sí |
| `NEXT_PUBLIC_SENTRY_DSN` | Vercel env vars | Sí | sentry.io | Sí |
| `SENTRY_DSN` | Vercel env vars | No (solo servidor) | sentry.io | Sí |
| `SENTRY_AUTH_TOKEN` | Vercel env vars | No | sentry.io | Sí |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Vercel env vars | Sí | Web Push API (auto-generado) | Sí — opcional hasta que se implemente Web Push |
| `NEXT_PUBLIC_MAP_STYLE_URL` | Vercel env vars | Sí | Tile server propio o Protomaps | Sí |
| `STITCH_API_KEY` | Solo `.env.local` de cada dev | No | stitch.design | No — herramienta de diseño local, no leída en runtime. Ver nota abajo. |

> **Nota sobre `STITCH_API_KEY`:** es una API key de tooling local (diseño UI). No está en el runtime schema ni en Vercel. Si se filtra, el riesgo es acceso a la cuenta de Stitch del desarrollador afectado — no hay impacto en producción. Rotar en el dashboard de stitch.design y actualizar el `.env.local` del desarrollador afectado.

> **Nota sobre `NEXT_PUBLIC_VAPID_PUBLIC_KEY`:** el schema la declara como opcional. Cuando se implemente Web Push, se necesitará también `VAPID_PRIVATE_KEY` (servidor). **Rotar el par VAPID invalida todas las suscripciones push activas de todos los usuarios** — planificar con anticipación. Ver §3.5.

> `NEXT_PUBLIC_*` se embebe en el bundle del cliente. `SENTRY_AUTH_TOKEN` es el de mayor sensibilidad: permite subir source maps y acceder al proyecto en Sentry.

---

## 2. Cuándo rotar

### 2.1 Rotación preventiva (planificada)

- Cada 90 días para `SENTRY_AUTH_TOKEN`.
- Cada 90 días para tokens del tile server si el proveedor usa autenticación por token (Protomaps u otro). Si es self-hosted sin token, no aplica.
- Al offboarding de cualquier miembro del equipo con acceso a los proveedores.
- Antes de hacer público el repositorio si alguna variable estuvo hardcodeada en algún commit histórico.

### 2.2 Rotación de emergencia (incidente)

Rotar **inmediatamente** si:

- El secret aparece en un commit, PR, log de CI, o mensaje de Slack/Discord.
- Un dispositivo con acceso al `.env.local` es comprometido o perdido.
- Un miembro del equipo deja la organización de forma no planificada.
- Sentry o el tile server reportan actividad anómala en el proyecto.

**Diferencia operacional clave con la rotación planificada:** en una emergencia, el token comprometido se revoca **primero**, antes de tener el reemplazo listo. El servicio queda temporalmente degradado (los builds no subirán source maps, por ejemplo) — eso es aceptable. Dejar un token comprometido activo mientras se prepara el reemplazo no lo es.

---

## 3. Procedimiento de rotación

### 3.1 `SENTRY_AUTH_TOKEN`

**Rotación planificada:**

1. Ir a **sentry.io → [tu organización] → Settings → Auth Tokens → Create New Token**.
2. Asignar los mismos scopes que el token actual. Verificar cuáles son abriendo el token existente antes de revocarlo. Los scopes requeridos para upload de source maps varían entre versiones de Sentry CLI; al momento de este runbook los necesarios son `project:write` y `org:ci` — confirmar en la pantalla de creación de Sentry qué scopes acepta la versión instalada.
3. Copiar el nuevo token.
4. En **Vercel → [Team] → [Project] → Settings → Environment Variables**, actualizar `SENTRY_AUTH_TOKEN` con el nuevo valor. Verificar si la variable está configurada a nivel de **proyecto** o de **team** — actualizar en el nivel correcto (o en ambos si hay duda). Aplicar a todos los entornos (Production, Preview, Development).
5. Disparar un redeploy manual en Vercel.
6. Verificar que el build suba source maps sin errores (revisar logs del step "Upload source maps" o equivalent en el build log de Vercel).
7. Una vez verificado, revocar el token anterior en sentry.io → Settings → Auth Tokens.

**Rotación de emergencia:**

1. **Revocar el token comprometido inmediatamente** en sentry.io → Settings → Auth Tokens. El siguiente deploy fallará en subir source maps — es el precio aceptable.
2. Generar un nuevo token (mismo procedimiento que pasos 1-3 arriba).
3. Actualizar en Vercel y rediployar.
4. Verificar que el build vuelva a subir source maps correctamente.

**Rollback:** si el nuevo token falla y el anterior ya fue revocado, generar inmediatamente un segundo token nuevo en Sentry y actualizar Vercel. No es posible restaurar un token revocado.

---

### 3.2 `NEXT_PUBLIC_SENTRY_DSN` y `SENTRY_DSN`

> El DSN identifica el proyecto en Sentry, no autentica operaciones privilegiadas. La rotación se hace regenerando el DSN.

**Rotación planificada:**

1. Ir a **sentry.io → [tu organización] → Settings → Projects → [proyecto] → Client Keys (DSN)**.
2. Crear una nueva Client Key.
3. Actualizar `NEXT_PUBLIC_SENTRY_DSN` y `SENTRY_DSN` en Vercel (verificar nivel proyecto vs. team, aplicar a todos los entornos).
4. Deshabilitar (no revocar todavía) la Client Key anterior en Sentry.
5. Rediployar en Vercel.
6. Verificar que los errores llegan correctamente a Sentry desde producción.
7. Mantener la key anterior deshabilitada hasta que confirmes que no llegan eventos bajo ella. Los assets estáticos de Next.js tienen hashes únicos por deploy — después de un redeploy todos los clientes nuevos usarán el nuevo DSN. Para clientes con la versión anterior cacheada en browser, la ventana de espera depende del cache TTL del browser (los chunks de `/_next/static/` tienen `Cache-Control: public, max-age=31536000, immutable`). En la práctica un redeploy es suficiente para producción; esperar 24–48 h es conservador pero razonable.
8. Revocar la Client Key anterior en Sentry una vez confirmada la transición.

**Rotación de emergencia:**

1. Revocar la Client Key comprometida en Sentry inmediatamente.
2. Crear nueva Client Key.
3. Actualizar en Vercel y rediployar.

**Rollback:** si la nueva Client Key falla, crear una segunda nueva. Las Client Keys revocadas no se pueden restaurar.

---

### 3.3 `NEXT_PUBLIC_MAP_STYLE_URL`

> Si el tile server usa autenticación por URL con token (ej. Protomaps API key embebida en la URL):

**Rotación planificada:**

1. Generar una nueva URL/token en el dashboard del proveedor de tiles.
2. Actualizar `NEXT_PUBLIC_MAP_STYLE_URL` en Vercel (nivel proyecto, todos los entornos).
3. Rediployar y verificar que el mapa carga en producción.
4. Revocar la URL/token anterior en el proveedor.

**Rotación de emergencia:**

1. **Revocar el token comprometido inmediatamente** en el dashboard del proveedor de tiles. El mapa quedará inaccesible hasta que el nuevo token esté activo — es el precio aceptable.
2. Generar un nuevo token/URL en el dashboard del proveedor.
3. Actualizar `NEXT_PUBLIC_MAP_STYLE_URL` en Vercel y rediployar.
4. Verificar que el mapa carga correctamente en producción.

**Rollback:** si el nuevo token falla, generar un segundo token nuevo en el proveedor. Los tokens revocados no se pueden restaurar.

> Si el tile server es self-hosted (demotiles de MapLibre, servidor propio), no hay token que rotar. Solo actualizar la URL si cambia el endpoint.

---

### 3.4 `NEXT_PUBLIC_APP_URL`

No es un secret — es la URL pública de la app. Solo se modifica si el dominio cambia. No aplica rotación periódica ni de emergencia.

---

### 3.5 `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (y `VAPID_PRIVATE_KEY` cuando se implemente)

> **Impacto crítico:** rotar el par VAPID invalida **todas** las suscripciones push activas de todos los usuarios. Planificar con comunicación previa si Web Push ya está en producción.

**Rotación planificada:**

1. Generar un nuevo par VAPID con `npx web-push generate-vapid-keys`.
2. Actualizar `NEXT_PUBLIC_VAPID_PUBLIC_KEY` en Vercel.
3. Actualizar `VAPID_PRIVATE_KEY` en Vercel (cuando exista en el schema).
4. Rediployar.
5. Todos los usuarios deberán re-suscribirse a las notificaciones push — planificar flujo de re-suscripción en la UI antes de la rotación.

**Rotación de emergencia:**

1. **Generar un nuevo par VAPID inmediatamente** con `npx web-push generate-vapid-keys`. A diferencia de otros secrets, no es posible "revocar" el par anterior en ningún dashboard — la invalidación ocurre automáticamente cuando el nuevo par entra en producción.
2. Actualizar `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y (cuando exista) `VAPID_PRIVATE_KEY` en Vercel.
3. Rediployar.
4. Comunicar al equipo que todas las suscripciones push existentes quedaron invalidadas. Los usuarios deberán re-suscribirse.

**Rollback:** no es posible restaurar el par anterior — no existe mecanismo de revocación en Web Push. Si el nuevo par tiene algún problema de configuración, generar un tercer par y volver a deployar.

---

### 3.6 `STITCH_API_KEY`

**Rotación planificada / emergencia:**

1. Ir al dashboard de stitch.design → API Keys → Crear nueva key.
2. Actualizar el `.env.local` del desarrollador afectado.
3. Revocar la key anterior en stitch.design.

No requiere redeploy de Vercel — esta variable no existe en el entorno de producción.

---

## 4. Checklist de verificación post-rotación

Completar todos los ítems antes de cerrar el incidente o la tarea de rotación planificada:

- [ ] El nuevo secret está activo en Vercel al nivel correcto (proyecto o team) y en todos los entornos aplicables.
- [ ] El secret anterior fue revocado en el proveedor.
- [ ] El redeploy de producción completó sin errores de build.
- [ ] El servicio afectado funciona correctamente en producción (logs, monitoreo).
- [ ] El `.env.example` en el repositorio refleja correctamente las variables (sin valores reales, solo placeholders).
- [ ] El equipo fue notificado para actualizar sus `.env.local` si aplica.
- [ ] **Si el trigger fue un leak en commit/PR:** ejecutar `git log --all -p -S '<prefijo-del-secret>'` para verificar que no hay otras ocurrencias en el historial (reemplazar `<prefijo-del-secret>` por los primeros caracteres únicos del valor comprometido). Si el historial está contaminado, evaluar reescritura de historia con coordinación del equipo o documentar la exposición como aceptada.
- [ ] **Si fue rotación de emergencia:** documentar en el canal del equipo: causa raíz, fecha/hora de detección, fecha/hora de revocación, fecha/hora de nuevo token activo.

---

## 5. Acceso y responsabilidades

| Acción | Quién puede ejecutarla |
|---|---|
| Crear/revocar tokens en Sentry | Owner o Admin del proyecto en sentry.io |
| Actualizar variables en Vercel | Owner o miembro con rol Editor en el proyecto Vercel |
| Rotar STITCH_API_KEY | El desarrollador afectado |
| Comunicar rotación al equipo | Quien ejecuta la rotación |

> Principio de mínimo privilegio: los tokens de CI/CD deben tener solo los scopes necesarios. Verificar los scopes del token existente antes de crear el reemplazo — no escalar permisos durante la rotación.

---

## 6. Fuera del alcance de este runbook

- **Credenciales de Supabase** — cuando se implemente el backend, crear `docs/runbooks/supabase-credentials.md`.
- **Claves de API de pago** — Ambulante MVP no procesa pagos (PRD §2.3).
- **Certificados TLS** — gestionados automáticamente por Vercel.
