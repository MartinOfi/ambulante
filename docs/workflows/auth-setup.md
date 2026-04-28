# Auth setup — Ambulante

Instrucciones para configurar los providers de autenticación en producción (Supabase Cloud).
La configuración local ya está en `supabase/config.toml` y funciona out-of-the-box con el CLI.

---

## Providers habilitados

| Provider | Local (config.toml) | Producción |
|---|---|---|
| Email/password | ✅ automático | ✅ habilitado por defecto |
| Magic link | ✅ automático | ✅ habilitado con email |
| Google OAuth | ✅ con vars de entorno | Requiere setup manual (ver abajo) |

---

## 1. Confirmación de email

La confirmación de email está habilitada (`enable_confirmations = true`). Los usuarios
deben hacer clic en el email de confirmación antes de poder iniciar sesión.

En producción, configurar un servidor SMTP real (SendGrid, Resend, Postmark) en
**Supabase Dashboard → Authentication → SMTP Settings**. El config local usa Inbucket
para capturar emails en `http://localhost:54324`.

---

## 2. Google OAuth

### 2.1 Crear el proyecto en Google Cloud Console

1. Ir a [console.cloud.google.com](https://console.cloud.google.com).
2. Crear un proyecto nuevo (ej: `ambulante-prod`) o usar uno existente.
3. Navegar a **APIs & Services → OAuth consent screen**.
4. Elegir **External** → completar el formulario:
   - App name: `Ambulante`
   - User support email: tu email de soporte
   - Developer contact: tu email
5. Agregar scopes: `email`, `profile`, `openid`.
6. Agregar dominios autorizados: tu dominio de producción (ej: `ambulante.app`).

### 2.2 Crear las credenciales OAuth 2.0

1. Ir a **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Authorized JavaScript origins:
   - `https://<tu-proyecto>.supabase.co` (URL del proyecto Supabase Cloud)
   - `https://ambulante.app` (dominio de producción)
4. Authorized redirect URIs:
   - `https://<tu-proyecto>.supabase.co/auth/v1/callback`
5. Hacer clic en **Create**.
6. Copiar el **Client ID** y el **Client Secret**.

### 2.3 Configurar los secrets en Supabase Cloud

**Opción A — Dashboard:**
1. Ir a **Supabase Dashboard → Authentication → Providers → Google**.
2. Pegar el Client ID y Client Secret.
3. Guardar.

**Opción B — Variables de entorno del proyecto (recomendado para CI/CD):**
```bash
supabase secrets set SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<client-id>
supabase secrets set SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<client-secret>
```

### 2.4 Para desarrollo local

Crear un OAuth client ID separado para `localhost`:
1. Authorized JavaScript origins: `http://localhost:3000`, `http://127.0.0.1:3000`
2. Authorized redirect URIs: `http://127.0.0.1:54321/auth/v1/callback`
3. Agregar las vars al `.env.local`:
   ```
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<client-id-local>
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<client-secret-local>
   ```
4. Reiniciar Supabase local: `pnpm supabase:stop && pnpm supabase:start`

> **Nota:** `skip_nonce_check = true` está habilitado en `config.toml` para desarrollo local.
> Esto es necesario porque el CLI local no puede completar el flujo OIDC completo de Google.
> En producción (Supabase Cloud), este flag **no aplica** — el nonce se verifica automáticamente.

---

## 3. Templates de email

Los templates están en `supabase/templates/`:

| Template | Archivo | Cuándo se usa |
|---|---|---|
| Magic link | `magic-link.html` | Sign in sin password |
| Confirmación | `confirmation.html` | Registro nuevo |

Los templates usan la variable `{{ .ConfirmationURL }}` que Supabase reemplaza con el
enlace real antes de enviar el email.

Para previsualizar en desarrollo, enviar un email de prueba desde Supabase Studio
(`http://localhost:54323`) o triggear un registro en la app — el email aparece en
Inbucket (`http://localhost:54324`).

---

## 4. Rotate de credenciales

Si un secret de Google OAuth se compromete:
1. Ir a Google Cloud Console → revocar el client secret comprometido.
2. Generar un nuevo secret.
3. Actualizar en Supabase Cloud (`supabase secrets set ...`).
4. Actualizar `.env.local` en las máquinas de desarrollo del equipo.
