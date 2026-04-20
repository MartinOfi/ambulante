# Toolchain obligatorio para tareas UI/estéticas (PASO 5)

Si tu tarea implica diseño visual, componentes UI, animaciones, ilustraciones o cualquier aspecto estético, seguí estas instrucciones **antes de escribir código visual propio**.

## Orden de uso

| # | Herramienta | Cuándo usarla | Cómo invocarla |
|---|---|---|---|
| 1 | **`/ui-ux-pro-max`** | Siempre primero — orienta el diseño y las decisiones estéticas | Skill: `/ui-ux-pro-max` |
| 2 | **21st.dev MCP** | Componentes UI listos: buscar inspiración, construir o refinar | `mcp__magic__21st_magic_component_builder`, `mcp__magic__21st_magic_component_inspiration`, `mcp__magic__21st_magic_component_refiner` |
| 3 | **MagicUI MCP** | Componentes animados del registry de Magic UI | `mcp__magicuidesign-mcp__searchRegistryItems`, `mcp__magicuidesign-mcp__getRegistryItem` |
| 4 | **Nanobanana MCP** | Generar o editar imágenes con IA | `mcp__nanobanana__generate_image` |
| 5 | **Stitch MCP** | Diseño de pantallas / interfaces completas | `mcp__stitch__generate_screen_from_text`, `mcp__stitch__edit_screens`, `mcp__stitch__fetch_screen_code` |

**Regla:** no implementes UI a mano sin haber consultado las herramientas de arriba. Si ninguna tiene lo que necesitás, documentalo en el chat antes de continuar con código propio.

## Consistencia visual (no negociable)

Antes de escribir cualquier estilo:
1. Leé `app/globals.css` para identificar los tokens de color, tipografía y espaciado del proyecto.
2. Leé `tailwind.config.ts` para confirmar qué clases existen en la paleta.

Toda pieza UI nueva **debe usar exclusivamente esos tokens**. Prohibido:
- Colores hardcodeados (`#fff`, `rgb(...)`, `hsl(...)`)
- Clases de Tailwind que no correspondan a la paleta existente

Si la tarea requiere un color nuevo → proponerlo como token en `globals.css` y justificarlo en el PASO 2. No usarlo directamente en el componente.
