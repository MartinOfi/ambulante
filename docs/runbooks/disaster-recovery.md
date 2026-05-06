# Runbook: Disaster Recovery — Ambulante

> **Audiencia:** desarrolladores con acceso Owner al proyecto Supabase Cloud y al proyecto Vercel.
> **Última revisión:** 2026-05-05
> **Tarea de origen:** [`B14.4`](../epic-backend/tasks/B14.4.md)
> **Cross-refs:**
> - [`incident-response.md`](./incident-response.md) — triage de incidentes (ejecutar ANTES de llegar acá)
> - [`migration-rollback.md`](./migration-rollback.md) — rollback de migraciones (no require restore completo)
> - [`prod-setup.md`](./prod-setup.md) — recrcar el proyecto Supabase si se necesita failover total
> - [`secret-rotation.md`](./secret-rotation.md) — rotar credentials después de un restore

---

## 1. Objetivos RTO / RPO

| Métrica | Objetivo | Contexto |
|---------|----------|----------|
| **RPO** (Recovery Point Objective — pérdida máxima de datos aceptable) | 24 horas | Supabase Pro hace backups automáticos diarios. Para reducir a minutos se necesita Point-in-Time Recovery (PITR), disponible en plan Pro como complemento. |
| **RTO** (Recovery Time Objective — tiempo máximo hasta recuperar el servicio) | 4 horas | Estimación conservadora para el restore manual descrito en §3. Con PITR puede bajar a ~1h. |

> **MVP:** el RPO de 24h es aceptable antes de usuarios externos masivos. Cuando el volumen de datos supere el umbral donde 24h de pérdida sea inaceptable para el negocio, activar PITR (Supabase Dashboard → Settings → Backups → Enable PITR).

---

## 2. Tipos de desastre y ruta de acción

| Escenario | Severidad | Ruta |
|-----------|-----------|------|
| Migración rota en producción | P2 | → `migration-rollback.md` (NO usar este runbook) |
| Secret comprometido | P1 | → `secret-rotation.md` emergencia, luego §4 de este doc |
| Pérdida de datos parcial (bug en lógica de negocio) | P1 | → §3.2 (restore selectivo) |
| Proyecto Supabase inaccesible / caído | P1 | → §3.1 si es de Supabase, §5 si requiere failover |
| Proyecto Supabase borrado accidentalmente | P1 | → §5 (failover total) |
| Corrupción total del schema | P1 | → §5 (failover total) |

---

## 3. Restore desde backup

### Checklist previo (SIEMPRE)

```
[ ] Confirmé que el incidente requiere restore y no solo rollback de migración.
    (Ver migration-rollback.md — es menos disruptivo si aplica.)
[ ] Avisé al equipo — habrá downtime.
[ ] Identifiqué el punto en el tiempo al que quiero restaurar.
[ ] Tengo acceso Owner al proyecto Supabase Cloud.
```

### 3.1 Restore completo (Supabase managed backup)

Supabase Cloud (plan Pro) guarda backups automáticos diarios y los retiene según el plan.

1. **Supabase Dashboard → Settings → Backups**.
2. Identificar el backup más cercano ANTES del evento de pérdida. Anotar timestamp.
3. Clic en **Restore** sobre ese backup.

   > ⚠️ El restore reemplaza la base de datos completa. Todo lo escrito después del punto de backup se pierde. Confirmar con el equipo.

4. Esperar que el restore complete (Supabase notifica por email y el dashboard cambia de estado).
5. Verificar que las migraciones están consistentes:

   ```bash
   npx supabase migration list --linked
   ```

   Si alguna migración quedó en estado inconsistente, ver `migration-rollback.md`.

6. Hacer un smoke test rápido:

   ```bash
   psql "$DATABASE_URL_POOLER" -c "select count(*) from public.orders;"
   ```

7. Notificar al equipo. Redactar post-mortem (plantilla en `incident-response.md`).

### 3.2 Restore selectivo (datos específicos)

Cuando solo se perdieron filas de una o pocas tablas y se conoce el rango temporal exacto:

1. Solicitar a Supabase soporte la exportación del backup como dump SQL para ese timestamp.
   (Supabase soporte → "I need to export data from a specific backup point".)
2. Conectarse con psql al proyecto de prod usando `DATABASE_URL_DIRECT`.
3. Restaurar solo las tablas afectadas:

   ```bash
   # Desde el dump exportado, filtrar solo las tablas necesarias:
   psql "$DATABASE_URL_DIRECT" -c "BEGIN;"
   # Insertar / actualizar las filas recuperadas (revisar conflictos con ON CONFLICT DO NOTHING)
   psql "$DATABASE_URL_DIRECT" -c "COMMIT;"
   ```

4. Verificar integridad referencial:

   ```sql
   -- Revisar FKs rotas (si las hay después del restore parcial)
   select conname, conrelid::regclass, confrelid::regclass
   from pg_constraint
   where contype = 'f'
     and not exists (
       select 1 from pg_class where oid = confrelid
     );
   ```

5. Smoke test de la funcionalidad afectada.
6. Post-mortem.

---

## 4. Después de un secret comprometido

Si las credenciales de prod fueron expuestas (en logs, en un error de Sentry, accidentalmente en un repo público):

1. Ir a `secret-rotation.md` y seguir el procedimiento de emergencia.
2. Una vez rotados los secrets en Supabase y Vercel, redeploy del frontend:
   ```bash
   vercel --prod
   ```
3. Verificar que el deploy nuevo usa las nuevas credenciales (smoke test de login).
4. Si la `SUPABASE_SERVICE_ROLE_KEY` fue comprometida: auditar los logs de Supabase para detectar accesos anómalos antes de la rotación.

   ```sql
   -- Actividad de auth en las últimas 24h (Supabase Studio → Logs → Auth Logs)
   -- No hay query directa; usar el panel de Supabase → Logs → Auth.
   ```

5. Si hay evidencia de acceso a datos de usuarios: notificar a los afectados y evaluar obligaciones legales.

---

## 5. Failover manual (proyecto Supabase inaccesible o destruido)

Usar cuando el proyecto Supabase de prod está completamente inaccesible y no hay ETA de recuperación de Supabase.

> **Advertencia:** este proceso tiene downtime garantizado. El tiempo estimado es 2-4 horas. Coordinar con todo el equipo antes de ejecutar.

### Paso 1 — Crear nuevo proyecto Supabase

Seguir `prod-setup.md §3`. Usar el mismo nombre `ambulante-prod` con sufijo `-2` o con la fecha de creación para diferenciarlo del anterior: `ambulante-prod-20260505`.

### Paso 2 — Aplicar schema desde el repo

```bash
# Desde el directorio principal del repo (no un worktree)
npx supabase link --project-ref <nuevo-project-ref>
npx supabase db push --db-url "$DATABASE_URL_DIRECT_NUEVO"
```

Esto aplica todas las migraciones del repo en el nuevo proyecto.

### Paso 3 — Restaurar datos

Dos sub-casos:

**A) El proyecto viejo sigue accesible para dumps:**

```bash
# Dump del proyecto viejo
pg_dump "$DATABASE_URL_DIRECT_VIEJO" \
  --no-acl --no-owner \
  --exclude-table=supabase_migrations \
  -F c -f ambulante-prod-dump.pgdump

# Restore en el nuevo
pg_restore --no-acl --no-owner \
  -d "$DATABASE_URL_DIRECT_NUEVO" \
  ambulante-prod-dump.pgdump
```

**B) El proyecto viejo no es accesible — usar el último backup:**

Supabase soporte puede exportar el último backup del proyecto destruido como dump SQL.
Abrir ticket urgente en soporte.supabase.com con el Project Reference del proyecto viejo.

### Paso 4 — Reconfigurar secrets

Siguiendo `prod-setup.md §4-6`, obtener las nuevas credenciales del nuevo proyecto y actualizar Vercel.

> Las VAPID keys y los secrets generados localmente (`CRON_SECRET`, `SUPABASE_WEBHOOK_SECRET`) no cambian — son independientes del proyecto Supabase.
> Lo que cambia: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL_POOLER`, `DATABASE_URL_DIRECT`.

### Paso 5 — Redeploy

```bash
vercel --prod
```

### Paso 6 — Verificación

- `psql "$DATABASE_URL_POOLER_NUEVO" -c 'select count(*) from public.orders;'` retorna un número plausible.
- Smoke test manual: login → mapa → pedido completo.
- Smoke test de seguridad: `psql` con anon JWT, intentar leer tabla `orders` → debe retornar 0 filas o error de RLS.

### Paso 7 — Cierre

```
[ ] Equipo notificado de que el servicio fue restaurado.
[ ] Project Reference viejo anotado para referencia histórica: _______________
[ ] Project Reference nuevo documentado: _______________
[ ] Fecha/hora de restore documentada: _______________
[ ] Post-mortem abierto (plantilla en incident-response.md §Plantilla de post-mortem).
```

---

## 6. Contactos de emergencia

| Recurso | URL / Contacto |
|---------|---------------|
| Supabase status | https://status.supabase.com |
| Supabase soporte | dashboard.supabase.com → Support |
| Vercel status | https://www.vercel-status.com |
| Responsable técnico de guardia | _____________ |
| Canal del equipo | _____________ |

---

## 7. Fuera del alcance

- **PITR (Point-in-Time Recovery):** disponible en Supabase Pro como complemento. Si se activa, el RPO baja a minutos y el procedimiento de restore cambia — actualizar este runbook al activarlo.
- **Multi-region / replica:** no en scope MVP. Si el volumen de tráfico o los SLAs lo requieren, evaluar en post-MVP.
- **Backups de Vercel deployments:** Vercel retiene el historial de deploys. Para revertir el frontend sin tocar la DB, usar Vercel Dashboard → Deployments → Promote a previous deployment.
