# Code review final + cierre del worktree (PASO 9)

Este paso se ejecuta **siempre** cuando la cadena cierra (Caso A del PASO 8).

---

## 9.1 · Code review

1. Ejecutá el agente de code review:
   ```
   /everything-claude-code:code-reviewer
   ```

2. El agente va a revisar **todos los archivos creados o modificados en esta cadena**.

3. Tomá **todos los issues** que reporte — critical, high, medium y low — y fixealos uno por uno.
   **No existe prioridad que excuse dejar un issue sin resolver**, con una única excepción: el protocolo de deuda técnica (ver `docs/workflows/debt-protocol.md`). Aplicalo así:
   - El fix depende completamente de algo que no existe todavía → anotalo en `Notas:` de la tarea futura. No es deuda.
   - El fix cambia el contrato de algo ya existente o requiere migración → registralo como `DT-N` en el epic y agregá `Resuelve: DT-N` en la tarea futura.
   - Cualquier otro caso → fixealo ahora. Severity baja no es excusa para diferir.

4. Por cada fix, corré `npx tsc --noEmit` y `npx vitest run` para verificar que no rompiste nada.

5. Si algún fix es complejo, aplicá el PASO 3 (auditoría) antes de escribirlo.

6. **Segunda pasada obligatoria (gate duro):** una vez aplicados todos los fixes, volvé a ejecutar el agente de code review. Esta segunda pasada es la prueba objetiva — no tu declaración de que terminaste.
   **No podés avanzar al 9.2 hasta que la segunda pasada devuelva 0 CRITICAL y 0 HIGH** sin una entrada de deuda técnica que los justifique. Si aparecen issues nuevos, fixealos y repetí la pasada.
   Declarar "listo" sin haber corrido la segunda pasada es una violación de protocolo.

---

## 9.2 · Verificación post-fix

Corré los 4 checks de `docs/workflows/verification.md` una vez más y pegá el output:

```bash
npx tsc --noEmit
npx vitest run
wc -l <archivos-tocados>
grep -rn 'console\.log\|: any\b' <archivos-tocados>
```

---

## 9.3 · Consulta al usuario

Una vez que el code review esté limpio y la verificación pase, imprimí **exactamente** esto:

```
✅ Code review completo. No quedan issues.

¿Querés que:
1. Commitee todos los cambios con el mensaje de cierre
2. Mergee `<branch>` a `main`
3. Borre el worktree `<dir>` y la branch `<branch>`

Respondé s (sí a todo) o decime qué pasos omitir.
```

- Si el usuario responde **s** o equivalente → ejecutá los 3 pasos en orden:
  1. `git add -p` (o por archivo) + `git commit -m "feat(fX.Y): <descripción>"`.
  2. Desde el principal: `git -C /Users/martinoficialdegui/Desktop/ambulante merge --no-ff <branch>`.
  3. Desde el principal: `git worktree remove <dir> && git branch -d <branch>`.
- Si el usuario pide omitir algún paso → respetalo y reportá qué quedó pendiente.
- Si hay conflictos en el merge → reportalos con detalle y esperá instrucciones. No fuerces.
