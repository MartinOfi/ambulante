# Runbook: Rollback de migración

Playbook para revertir una migración de base de datos en producción o staging.
Seguí los pasos en orden. No saltes pasos.

---

## Cuándo usar este runbook

- Una migración se aplicó y produjo errores en producción.
- Se detectó comportamiento incorrecto en datos después de una migración.
- Un `supabase db push` falló a mitad y dejó el schema en estado inconsistente.

---

## Antes de empezar

**Checklist obligatorio:**

- [ ] Tenés acceso al panel de Supabase Cloud (proyecto prod).
- [ ] Tenés la Supabase CLI instalada y autenticada (`npx supabase login`).
- [ ] Sabés exactamente qué migración querés revertir (nombre del archivo `.sql`).
- [ ] Avisaste al equipo que va a haber downtime o degradación temporal.
- [ ] Tenés un backup reciente (Supabase Cloud hace backups automáticos cada 24h).

---

## Paso 1 — Identificar la migración problemática

```bash
# Ver el historial de migraciones aplicadas en producción
npx supabase migration list --linked

# Salida esperada:
#   LOCAL      │ REMOTE   │ TIME (UTC)
#   ───────────┼──────────┼────────────────────────
#   20260428…  │ applied  │ 2026-04-28 00:00:00 UTC
#   20260429…  │ applied  │ 2026-04-29 14:19:00 UTC   ← esta es la problemática
```

Anotá el nombre exacto del archivo de migración a revertir.

---

## Paso 2 — Crear el worktree de rollback (no toques main)

```bash
git worktree add ../ambulante-rollback -b rollback/migration-$(date +%Y%m%d-%H%M)
cd ../ambulante-rollback
```

---

## Paso 3 — Generar la migración inversa

```bash
# Opción A: Si la migración original tiene un bloque DOWN documentado,
# usalo directamente (las migraciones del proyecto NO tienen bloques DOWN
# — pasá a la opción B).

# Opción B: Escribir el SQL inverso manualmente.
# Por ejemplo, si la migración agregó una columna:
#   ALTER TABLE orders ADD COLUMN cancelled_at timestamptz;
# La inversa es:
#   ALTER TABLE orders DROP COLUMN IF EXISTS cancelled_at;

# Crear el archivo de rollback con timestamp posterior al original:
ROLLBACK_FILE="supabase/migrations/$(date +%Y%m%d%H%M%S)_rollback_<nombre-corto>.sql"
```

### Reglas para escribir el SQL inverso

| Operación original             | Operación inversa                        |
|--------------------------------|------------------------------------------|
| `ADD COLUMN`                   | `DROP COLUMN IF EXISTS`                  |
| `DROP COLUMN`                  | `ADD COLUMN IF NOT EXISTS` (recuperar de backup si hay datos) |
| `CREATE TABLE`                 | `DROP TABLE IF EXISTS`                   |
| `DROP TABLE`                   | Recuperar desde backup — ver Paso 6      |
| `CREATE INDEX`                 | `DROP INDEX IF EXISTS`                   |
| `ALTER TABLE ADD CONSTRAINT`   | `ALTER TABLE DROP CONSTRAINT IF EXISTS`  |
| `CREATE POLICY`                | `DROP POLICY IF EXISTS`                  |
| `CREATE FUNCTION`              | `DROP FUNCTION IF EXISTS` o restaurar versión anterior |
| `INSERT INTO supabase_migrations` | No revertir directamente — ver Paso 5 |

---

## Paso 4 — Testear el rollback en local antes de aplicar en prod

```bash
# Reset local con el estado actual de prod (sin la migración inversa todavía)
pnpm supabase:reset

# Aplicar manualmente el SQL inverso contra local para verificar que no rompe nada
npx supabase db query --file "$ROLLBACK_FILE"

# Verificar que el schema quedó como esperabas
npx supabase db diff
```

Si el diff muestra lo que esperás → seguí al Paso 5.
Si hay errores → corregí el SQL inverso y repetí.

---

## Paso 5 — Aplicar el rollback en producción

```bash
# Linkear al proyecto de producción (si no lo hiciste ya)
npx supabase link --project-ref <SUPABASE_PROJECT_REF>

# Push de la migración inversa a producción
npx supabase db push
```

Esto aplica `$ROLLBACK_FILE` a producción y lo registra en `supabase_migrations`.

### Verificar que se aplicó correctamente

```bash
npx supabase migration list --linked
# El rollback debe aparecer como "applied" con timestamp reciente.

# Verificar schema en prod (requiere acceso directo a la DB o Studio)
npx supabase db query "select table_name, column_name from information_schema.columns where table_schema = 'public' order by table_name, ordinal_position" --linked
```

---

## Paso 6 — Si hubo pérdida de datos (DROP TABLE / DROP COLUMN)

Supabase Cloud hace backups automáticos cada 24h (retención: 7 días en Pro, 30 en Team).

```bash
# En el panel de Supabase Cloud:
# Database → Backups → elegí el snapshot anterior a la migración problemática.
# Descargá el dump y extraé solo la tabla/columna afectada.

# Restaurar una tabla específica desde un dump pg:
pg_restore -d <connection_string> -t <tabla> --data-only dump.pg
```

Si el volumen de datos es grande o la ventana de recuperación es corta → escalá al equipo de Supabase (soporte) antes de proceder.

---

## Paso 7 — Post-mortem

Una vez resuelto el incidente, registrá:

1. **Qué migración falló y por qué.**
2. **Cuánto tiempo de degradación hubo.**
3. **Qué mejorar:** ¿faltó testear en staging? ¿el SQL inverso era predecible y debería estar en el mismo PR?

Guardá el post-mortem en `docs/post-mortems/<YYYY-MM-DD>-<slug>.md`.

---

## Comandos de referencia rápida

```bash
# Ver historial de migraciones
npx supabase migration list --linked

# Diff entre local y linked
npx supabase db diff --linked

# Push solo dry-run (muestra qué aplicaría sin aplicar)
npx supabase db push --dry-run

# Repair: marcar una migración como applied sin ejecutarla (emergencia)
npx supabase migration repair --status applied <timestamp>

# Repair: marcar como revertida (borrar del historial)
npx supabase migration repair --status reverted <timestamp>
```

---

## Escalada

Si el problema no se resuelve en **30 minutos** → escalá vía el canal `#backend-incidents`.
Si hay pérdida de datos confirmada → contactar soporte de Supabase inmediatamente.
