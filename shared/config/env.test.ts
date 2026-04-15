import { describe, expect, it } from "vitest";

import { parseEnv } from "./env.mjs";

describe("parseEnv", () => {
  const validRawEnv = {
    NODE_ENV: "development",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  } as const;

  it("parses a valid environment and returns a frozen typed object", () => {
    const parsed = parseEnv(validRawEnv);

    expect(parsed.NODE_ENV).toBe("development");
    expect(parsed.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(Object.isFrozen(parsed)).toBe(true);
  });

  it("defaults NODE_ENV to development when missing", () => {
    const parsed = parseEnv({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });

    expect(parsed.NODE_ENV).toBe("development");
  });

  it("throws a Spanish, human-readable error when NEXT_PUBLIC_APP_URL is missing", () => {
    expect(() => parseEnv({ NODE_ENV: "development" })).toThrowError(
      /Configuración inválida de variables de entorno/,
    );
  });

  it("throws when NEXT_PUBLIC_APP_URL is not a valid URL", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "development",
        NEXT_PUBLIC_APP_URL: "not-a-url",
      }),
    ).toThrowError(/NEXT_PUBLIC_APP_URL/);
  });

  it("rejects NODE_ENV values outside the canonical set", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "staging",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      }),
    ).toThrowError(/NODE_ENV/);
  });
});
