# Verificación final — 4 checks (PASO 6)

Corré los 4 checks abajo. **Outputs silenciosos** — sólo imprimís el veredicto, no el log completo.

```bash
# 1. TypeScript — 0 errores
npx tsc --noEmit 2>&1 | tail -5

# 2. Tests — todos verdes (reporter compacto)
npx vitest run --reporter=dot 2>&1 | tail -10

# 3. Tamaño de archivos — ningún componente >200 líneas, ningún archivo >300
git diff main...HEAD --name-only | xargs wc -l 2>/dev/null | tail -1

# 4. Artefactos prohibidos — debe devolver vacío
git diff main...HEAD --name-only | xargs grep -nE 'console\.log|: any\b' 2>/dev/null || echo "OK: 0 matches"
```

**Criterios de aceptación:**
- `tsc`: 0 errores.
- `vitest`: 0 fail.
- `wc`: ningún componente >200 líneas, ningún archivo >300.
- `grep`: `OK: 0 matches`.

**Output esperado (silencioso):**
```
✅ tsc 0 errors · vitest <N> passed · max <N> lines · grep OK
```

Si algo falla → fijá el problema antes de avanzar. NO sigas con verificación parcial.

## DB-only checks (sólo si tu tarea toca SQL/migraciones)

```bash
pnpm supabase:reset --silent 2>&1 | tail -3
pnpm supabase:test 2>&1 | tail -5
[ -f scripts/db-audit-fk-indexes.sql ] && psql "$SUPABASE_DB_URL" -t -A -f scripts/db-audit-fk-indexes.sql | head -5
[ -f scripts/check-supabase-imports.sh ] && bash scripts/check-supabase-imports.sh
```

Veredicto esperado: `reset OK · pgtap OK · fk-audit empty · imports OK`.
