"use strict";

/**
 * Local ESLint rules for the Ambulante project.
 *
 * Why: Enforces that all UI copy lives in messages/es-AR.json and is accessed
 * via next-intl's `t()` / `useTranslations` instead of being hardcoded in JSX.
 */

/**
 * Returns true when a string value looks like human-readable UI copy
 * (i.e. it has letters and is not a purely technical identifier).
 *
 * Excluded patterns:
 *  - empty / whitespace-only strings
 *  - strings with no Unicode letters (e.g. "+" "-" "---" "..." symbols)
 *  - strings that look like CSS classes, URLs, file paths, or format tokens
 *  - single words that are clearly code artefacts (aria roles, HTML tags, data-* values)
 */
function looksLikeUiCopy(value) {
  if (typeof value !== "string") return false;

  const trimmed = value.trim();
  if (!trimmed) return false;

  // Must contain at least one letter (Unicode-aware)
  if (!/\p{L}/u.test(trimmed)) return false;

  // Exclude things that look like CSS class strings, Tailwind utilities, or
  // strings that start with a dot or slash (path-like)
  if (/^[./]/.test(trimmed)) return false;

  // Exclude pure single-word identifiers that are likely code artefacts or
  // ARIA roles (no spaces, all-lowercase, shorter than 3 chars).
  // We still want to catch things like "Mapa" (single word, UI copy).
  // Strategy: flag strings that contain a space OR start with a capital letter
  // OR are longer than 2 words worth of lowercase.
  const hasSpace = /\s/.test(trimmed);
  const startsUppercase = /^\p{Lu}/u.test(trimmed);
  const hasAccent = /[áéíóúüñÁÉÍÓÚÜÑ¿¡]/.test(trimmed);

  return hasSpace || startsUppercase || hasAccent;
}

module.exports = {
  "no-hardcoded-jsx-strings": {
    meta: {
      type: "suggestion",
      docs: {
        description: "Disallow hardcoded UI strings in JSX. Use next-intl `t()` instead.",
        category: "i18n",
        recommended: true,
        url: "https://next-intl-docs.vercel.app/docs/usage/messages",
      },
      schema: [],
      messages: {
        hardcodedString: 'Hardcoded UI string "{{value}}" found in JSX. Use next-intl t() instead.',
        hardcodedAttr:
          'Hardcoded UI string "{{value}}" found in JSX attribute. Use next-intl t() instead.',
      },
    },
    create(context) {
      /**
       * Attribute names whose string values are always i18n candidates
       * (labels, titles, descriptions visible to users).
       */
      const I18N_ATTRS = new Set(["aria-label", "aria-description", "placeholder", "title", "alt"]);

      /**
       * Attribute names that are never UI copy (technical / structural).
       */
      const SKIP_ATTRS = new Set([
        "className",
        "id",
        "name",
        "type",
        "href",
        "src",
        "rel",
        "target",
        "role",
        "data-testid",
        "data-cy",
        "style",
        "key",
        "ref",
        "htmlFor",
        "autoComplete",
        "method",
        "action",
        "encType",
        "pattern",
        "min",
        "max",
        "step",
        "tabIndex",
      ]);

      return {
        // JSX text content: <Button>Guardar</Button>
        JSXText(node) {
          const raw = node.value;
          if (looksLikeUiCopy(raw)) {
            context.report({
              node,
              messageId: "hardcodedString",
              data: { value: raw.trim() },
            });
          }
        },

        // JSX string attributes: aria-label="Cerrar menú"  placeholder="Buscar…"
        JSXAttribute(node) {
          if (!node.value) return;
          if (node.name.type !== "JSXIdentifier") return;

          const attrName = node.name.name;
          if (SKIP_ATTRS.has(attrName)) return;

          if (node.value.type === "Literal") {
            const val = node.value.value;
            if (I18N_ATTRS.has(attrName) && looksLikeUiCopy(val)) {
              context.report({
                node: node.value,
                messageId: "hardcodedAttr",
                data: { value: val },
              });
            }
          }
        },
      };
    },
  },
};
