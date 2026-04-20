// @vitest-environment node
/**
 * Tests for the custom `no-hardcoded-jsx-strings` ESLint rule.
 *
 * Uses ESLint's RuleTester (Node API) to validate correct detection of
 * hardcoded UI strings in JSX. Node environment needed (not jsdom).
 */

import { describe, it, expect } from "vitest";
import { RuleTester } from "eslint";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const rules = require("../../eslint-local-rules") as Record<
  string,
  { meta: object; create: (ctx: unknown) => unknown }
>;

const rule = rules["no-hardcoded-jsx-strings"];

const tester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    ecmaFeatures: { jsx: true },
    sourceType: "module",
  },
});

describe("no-hardcoded-jsx-strings ESLint rule", () => {
  it("passes all RuleTester valid/invalid cases", () => {
    /**
     * RuleTester.run() throws synchronously if any case fails.
     * If we reach the expect below, all cases passed.
     */
    tester.run("no-hardcoded-jsx-strings", rule, {
      valid: [
        // Variables / expressions — not literal strings
        { code: "const x = <Button>{label}</Button>" },
        { code: 'const x = <Button>{t("save")}</Button>' },

        // Whitespace-only JSX text (newlines, indentation) — should be ignored
        { code: "const x = <div>\n  {children}\n</div>" },

        // Technical attributes excluded by SKIP_ATTRS
        { code: 'const x = <input className="btn-primary" />' },
        { code: 'const x = <a href="/home" rel="noopener" />' },
        { code: 'const x = <input type="email" />' },
        { code: 'const x = <div data-testid="map-container" />' },

        // aria-label provided via expression (already using t())
        { code: 'const x = <button aria-label={t("close")} />' },

        // Symbols-only strings (not UI copy)
        { code: "const x = <span>+</span>" },
        { code: "const x = <span>---</span>" },
      ],

      invalid: [
        // Spanish UI copy in JSX text (starts uppercase)
        {
          code: "const x = <Button>Guardar cambios</Button>",
          errors: [{ messageId: "hardcodedString" }],
        },
        {
          code: "const x = <h1>Panel de administración</h1>",
          errors: [{ messageId: "hardcodedString" }],
        },
        // Spanish with accent
        {
          code: "const x = <p>Próximamente.</p>",
          errors: [{ messageId: "hardcodedString" }],
        },
        // Single word with uppercase (UI label like "Mapa", "Perfil")
        {
          code: "const x = <span>Mapa</span>",
          errors: [{ messageId: "hardcodedString" }],
        },
        // Multi-word lowercase Spanish
        {
          code: "const x = <span>cerrar sesión</span>",
          errors: [{ messageId: "hardcodedString" }],
        },
        // aria-label with hardcoded Spanish text
        {
          code: 'const x = <button aria-label="Cerrar menú" />',
          errors: [{ messageId: "hardcodedAttr" }],
        },
        // placeholder with hardcoded text
        {
          code: 'const x = <input placeholder="Buscar tiendas" />',
          errors: [{ messageId: "hardcodedAttr" }],
        },
        // title with hardcoded text
        {
          code: 'const x = <img title="Logo de Ambulante" />',
          errors: [{ messageId: "hardcodedAttr" }],
        },
      ],
    });

    expect(true).toBe(true);
  });
});
