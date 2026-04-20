# Verificación final — 4 checks obligatorios (PASO 6)

Ejecutá los 4 y pegá el output en el chat. Si algo falla, fijalo antes de cerrar la tarea.

```bash
# 1. TypeScript — 0 errores
npx tsc --noEmit

# 2. Tests — todos verdes, coverage ≥80% en archivos nuevos
npx vitest run

# 3. Tamaño de archivos — ningún componente >200 líneas, ningún archivo >300
wc -l <archivos-tocados>

# 4. Artefactos prohibidos — debe devolver vacío
grep -rn 'console\.log\|: any\b' <archivos-tocados>
```

**Criterios de aceptación:**
- `tsc`: 0 errores, 0 warnings de tipo.
- `vitest`: 0 tests fallando; coverage ≥80% para cada archivo nuevo con lógica.
- `wc -l`: ningún componente supera 200, ningún otro archivo supera 300.
- `grep`: output vacío (cero matches).

Si alguno no pasa → fijalo y volvé a correr ese check antes de avanzar.
