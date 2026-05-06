# Runbook: Go-live Checklist — Ambulante

> **Audiencia:** responsable técnico del primer deploy a producción con usuarios externos.
> **Última revisión:** 2026-05-05
> **Tarea de origen:** [`B14.4`](../epic-backend/tasks/B14.4.md)
> **Cross-refs:**
> - [`prod-setup.md`](./prod-setup.md) — setup inicial de Supabase Cloud + secrets
> - [`secret-rotation.md`](./secret-rotation.md) — rotación periódica de credentials
> - [`incident-response.md`](./incident-response.md) — triage de incidentes post-go-live
> - [`migration-rollback.md`](./migration-rollback.md) — rollback de migraciones
> - [`disaster-recovery.md`](./disaster-recovery.md) — restore y failover

Checklist de una sola pasada. Completar todos los ítems antes del primer usuario externo. No hay orden estricto dentro de cada sección, pero la sección **Infraestructura** es prerequisito de todo lo demás.

---

## A — Infraestructura

```
[ ] A1. Proyecto Supabase Cloud creado en sa-east-1 (plan Pro o superior).
        Ver prod-setup.md §3.

[ ] A2. Todas las variables de entorno inyectadas en Vercel y validadas
        por el schema Zod (pnpm typecheck && pnpm test -- env.schema).
        Ver prod-setup.md §7-8.

[ ] A3. Pool de conexiones en modo Transaction (puerto 6543).
        Verificar: psql "$DATABASE_URL_POOLER" -c 'show port' retorna 6543.

[ ] A4. Todas las migraciones aplicadas en prod sin errores.
        Verificar: npx supabase migration list --linked → todos en "applied".

[ ] A5. Backups automáticos confirmados activos.
        Supabase → Settings → Backups → "Point in Time Recovery" o "Daily Backups" activo.
        Anotar la retención: _______ días.

[ ] A6. pg_cron y pg_net habilitados.
        select * from pg_extension where extname in ('pg_cron','pg_net');
        → ambos deben aparecer.

[ ] A7. Cron de expiración de pedidos corriendo.
        select jobname, schedule, active from pg_cron.job;
        → 'expire-orders' activo con schedule correcto.

[ ] A8. Pipeline de CI/CD completando sin errores en la branch main.
        Ver B14.2 — supabase migration list + tests + deploy Vercel.
```

---

## B — Seguridad y control de acceso

```
[ ] B1. RLS habilitado en todas las tablas de datos de usuario.
        select relname, relrowsecurity
        from pg_class join pg_namespace on relnamespace = pg_namespace.oid
        where nspname = 'public' and relkind = 'r' and not relrowsecurity;
        → debe retornar 0 filas (ninguna tabla sin RLS).

[ ] B2. Anon role no puede leer tablas sensibles directamente.
        Security smoke tests en e2e/security/ pasando en CI (B13-A).

[ ] B3. Rate limiting activo en endpoints críticos.
        Verificar que check_rate_limit() existe y está en uso:
        select proname from pg_proc where proname = 'check_rate_limit';
        Flood test (100 req/s a /api/orders/submit) retorna 429 antes de 10s.

[ ] B4. Google OAuth configurado con redirect URI correcta en Supabase Cloud.
        https://<project-ref>.supabase.co/auth/v1/callback en Google Cloud Console.
        Ver prod-setup.md §5.

[ ] B5. SUPABASE_SERVICE_ROLE_KEY no aparece en logs de Vercel ni en el bundle.
        Verificar: grep -r "service_role" .next/ (si existe build local) → 0 resultados.

[ ] B6. VAPID keys generadas y distintas de las de desarrollo local.
        VAPID_PUBLIC_KEY y NEXT_PUBLIC_VAPID_PUBLIC_KEY tienen el mismo valor
        (el schema lo valida). Ver prod-setup.md §6.2.

[ ] B7. Sentry configurado y recibiendo errores.
        Lanzar un error sintético desde una ruta de prod y verificar que llega a Sentry
        con environment=production. DSN en variable NEXT_PUBLIC_SENTRY_DSN.

[ ] B8. Sentry tiene alertas configuradas para llegar a alguien.
        Sentry → Alerts → al menos una regla con acción "notify" a email o Slack
        del equipo. Responsable de alertas: _____________.
```

---

## C — Observabilidad

```
[ ] C1. Logs de Vercel accesibles para al menos un miembro del equipo.
        Vercel Dashboard → [proyecto] → Logs → al menos un deploy exitoso visible.

[ ] C2. Supabase Studio accesible (al menos Owner del proyecto puede entrar).
        dashboard.supabase.com → proyecto ambulante-prod → abre sin error.

[ ] C3. pg_stat_statements habilitado (requerido por incident-response.md §Caso E).
        select * from pg_extension where extname = 'pg_stat_statements';

[ ] C4. Contacto de escalada definido y documentado.
        incident-response.md §6 tiene nombres reales (no "CTO" genérico).
        Responsable P1: _____________. Canal de incidentes: _____________.
```

---

## D — Funcionalidad crítica (smoke test manual)

```
[ ] D1. Login con Google completa sin error y persiste sesión tras refresh.

[ ] D2. Alta de tienda: un usuario nuevo puede completar el onboarding de tienda
        y quedar en estado pending_approval.

[ ] D3. Mapa de tiendas: al menos una tienda con current_location aparece en el mapa.
        (Puede requerir seed manual — ver docs/workflows/dev-seed.md.)

[ ] D4. Flujo de pedido completo: cliente crea pedido → tienda acepta → finaliza.
        Verificar que los timestamps de cada transición se registran.

[ ] D5. Expiración de pedido: crear un pedido y esperar (o forzar via SQL) que
        el cron lo expire a los 10 min. Verificar estado EXPIRADO.

[ ] D6. Push notifications: instalar la PWA en un dispositivo, suscribirse,
        y verificar que llega una notificación de prueba.
        (En iOS: solo funciona post-instalación — ver CLAUDE.md §9.)

[ ] D7. Ubicación desactualizada: simular > 2 min sin update de ubicación de tienda
        y verificar que el frontend muestra el badge "ubicación desactualizada".
```

---

## E — Datos y privacidad

```
[ ] E1. La ubicación exacta del cliente NO aparece en la respuesta de la API
        de la tienda antes de que el pedido esté en estado ACEPTADO.
        Test: query directa con el JWT de una tienda a la tabla orders filtrando
        un pedido en estado ENVIADO — client_location debe ser null o ausente.

[ ] E2. Snapshot de producto en pedidos: editar un producto después de crear
        un pedido y verificar que el pedido conserva el snapshot original.

[ ] E3. Tienda A no puede ver pedidos de tienda B.
        RLS smoke test incluido en e2e/security/ (B13-A). Verificar que pasa.
```

---

## F — Comunicación y lanzamiento

```
[ ] F1. URL de producción definida y configurada en Supabase Auth → Site URL.
        Dominio final: _____________.

[ ] F2. Redirect URLs de auth incluyen el dominio de prod y el wildcard de previews.
        https://ambulante.app/**, https://*.vercel.app/**

[ ] F3. Equipo notificado con al menos 24h de anticipación al go-live.
        Canal / medio: _____________.

[ ] F4. Runbook de disaster recovery leído por al menos un miembro del equipo.
        Ver disaster-recovery.md. Responsable: _____________.

[ ] F5. Password del proyecto Supabase guardada en el password manager del equipo.
        (Requerida para psql directo y para regenerar connection strings.)
```

---

## Firma de aprobación

```
Fecha de go-live: _______________
Completado por:   _______________
Aprobado por:     _______________

Items con excepción documentada (si alguno queda pendiente con justificación):
  -
```

---

## Fuera del alcance de este checklist

- Rotación periódica de secrets post-go-live → `secret-rotation.md`
- Respuesta a incidentes una vez en producción → `incident-response.md`
- Rollback de una migración problemática → `migration-rollback.md`
- Restore desde backup → `disaster-recovery.md`
