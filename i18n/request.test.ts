import { describe, it, expect } from "vitest";
import { LOCALE } from "@/shared/constants/i18n";
import messages from "@/messages/es-AR.json";

describe("i18n setup", () => {
  it("uses Argentine Spanish as the default locale", () => {
    expect(LOCALE).toBe("es-AR");
  });

  it("messages/es-AR.json has required top-level namespaces", () => {
    expect(messages).toHaveProperty("Landing");
    expect(messages).toHaveProperty("Common");
  });

  it("Landing.Hero has all required keys", () => {
    const hero = messages.Landing.Hero;
    expect(hero).toHaveProperty("badge");
    expect(hero).toHaveProperty("heading");
    expect(hero).toHaveProperty("description");
    expect(hero).toHaveProperty("ctaRegister");
    expect(hero).toHaveProperty("ctaMap");
    expect(hero).toHaveProperty("activeNearby");
  });

  it("Landing.Nav has all required keys", () => {
    const nav = messages.Landing.Nav;
    expect(nav).toHaveProperty("cta");
  });

  it("Common has error and action keys", () => {
    const common = messages.Common;
    expect(common).toHaveProperty("errors");
    expect(common).toHaveProperty("actions");
  });

  it("all message values are non-empty strings", () => {
    function assertNonEmptyStrings(obj: unknown, path = ""): void {
      if (typeof obj === "string") {
        expect(obj.trim().length, `empty string at ${path}`).toBeGreaterThan(0);
        return;
      }
      if (typeof obj === "object" && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          assertNonEmptyStrings(value, path ? `${path}.${key}` : key);
        }
      }
    }
    assertNonEmptyStrings(messages);
  });
});
