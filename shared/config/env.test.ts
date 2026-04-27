import { describe, expect, it } from "vitest";

import { parseClientEnv, parseEnv, parseServerEnv } from "./env.schema";

const validBase = {
  NODE_ENV: "development",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
} as const;

describe("parseEnv (backward compat alias for parseServerEnv)", () => {
  it("parses a valid environment and returns a frozen typed object", () => {
    const parsed = parseEnv(validBase);

    expect(parsed.NODE_ENV).toBe("development");
    expect(parsed.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(Object.isFrozen(parsed)).toBe(true);
  });

  it("defaults NODE_ENV to development when missing", () => {
    const parsed = parseEnv({ NEXT_PUBLIC_APP_URL: "http://localhost:3000" });

    expect(parsed.NODE_ENV).toBe("development");
  });

  it("throws a Spanish, human-readable error when NEXT_PUBLIC_APP_URL is missing", () => {
    expect(() => parseEnv({ NODE_ENV: "development" })).toThrowError(
      /Configuración inválida de variables de entorno/,
    );
  });

  it("throws when NEXT_PUBLIC_APP_URL is not a valid URL", () => {
    expect(() =>
      parseEnv({ NODE_ENV: "development", NEXT_PUBLIC_APP_URL: "not-a-url" }),
    ).toThrowError(/NEXT_PUBLIC_APP_URL/);
  });

  it("rejects NODE_ENV values outside the canonical set", () => {
    expect(() =>
      parseEnv({ NODE_ENV: "staging", NEXT_PUBLIC_APP_URL: "http://localhost:3000" }),
    ).toThrowError(/NODE_ENV/);
  });

  describe("NEXT_PUBLIC_MAP_STYLE_URL", () => {
    it("is optional — parses without the field", () => {
      const parsed = parseEnv(validBase);
      expect(parsed.NEXT_PUBLIC_MAP_STYLE_URL).toBeUndefined();
    });

    it("accepts a valid URL", () => {
      const parsed = parseEnv({
        ...validBase,
        NEXT_PUBLIC_MAP_STYLE_URL: "https://demotiles.maplibre.org/style.json",
      });
      expect(parsed.NEXT_PUBLIC_MAP_STYLE_URL).toBe("https://demotiles.maplibre.org/style.json");
    });

    it("rejects an invalid URL", () => {
      expect(() => parseEnv({ ...validBase, NEXT_PUBLIC_MAP_STYLE_URL: "not-a-url" })).toThrowError(
        /NEXT_PUBLIC_MAP_STYLE_URL/,
      );
    });
  });
});

describe("parseClientEnv", () => {
  it("parses client-safe vars and returns a frozen object", () => {
    const parsed = parseClientEnv(validBase);

    expect(parsed.NODE_ENV).toBe("development");
    expect(parsed.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(Object.isFrozen(parsed)).toBe(true);
  });

  it("does not include SUPABASE_SERVICE_ROLE_KEY in the parsed result", () => {
    const parsed = parseClientEnv({
      ...validBase,
      SUPABASE_SERVICE_ROLE_KEY: "secret",
    });

    expect("SUPABASE_SERVICE_ROLE_KEY" in parsed).toBe(false);
  });

  it("does not include DATABASE_URL_POOLER in the parsed result", () => {
    const parsed = parseClientEnv({
      ...validBase,
      DATABASE_URL_POOLER: "postgresql://localhost:6543/postgres",
    });

    expect("DATABASE_URL_POOLER" in parsed).toBe(false);
  });

  it("accepts NEXT_PUBLIC_SUPABASE_URL when valid", () => {
    const parsed = parseClientEnv({
      ...validBase,
      NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
    });

    expect(parsed.NEXT_PUBLIC_SUPABASE_URL).toBe("https://abc.supabase.co");
  });

  it("rejects NEXT_PUBLIC_SUPABASE_URL when not a valid URL", () => {
    expect(() =>
      parseClientEnv({ ...validBase, NEXT_PUBLIC_SUPABASE_URL: "not-a-url" }),
    ).toThrowError(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});

describe("parseServerEnv", () => {
  it("is backward-compatible — passes with minimal required vars only", () => {
    const parsed = parseServerEnv(validBase);

    expect(parsed.NODE_ENV).toBe("development");
    expect(Object.isFrozen(parsed)).toBe(true);
  });

  describe("NEXT_PUBLIC_SUPABASE_URL", () => {
    it("is optional — absent does not throw", () => {
      const parsed = parseServerEnv(validBase);
      expect(parsed.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
    });

    it("accepts a valid URL", () => {
      const parsed = parseServerEnv({
        ...validBase,
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
      });
      expect(parsed.NEXT_PUBLIC_SUPABASE_URL).toBe("http://localhost:54321");
    });

    it("rejects an invalid URL when present", () => {
      expect(() =>
        parseServerEnv({ ...validBase, NEXT_PUBLIC_SUPABASE_URL: "not-a-url" }),
      ).toThrowError(/NEXT_PUBLIC_SUPABASE_URL/);
    });
  });

  describe("NEXT_PUBLIC_SUPABASE_ANON_KEY", () => {
    it("is optional — absent does not throw", () => {
      const parsed = parseServerEnv(validBase);
      expect(parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeUndefined();
    });

    it("rejects an empty string when present", () => {
      expect(() =>
        parseServerEnv({ ...validBase, NEXT_PUBLIC_SUPABASE_ANON_KEY: "" }),
      ).toThrowError(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
    });
  });

  describe("SUPABASE_SERVICE_ROLE_KEY", () => {
    it("is optional — absent does not throw", () => {
      const parsed = parseServerEnv(validBase);
      expect(parsed.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    });

    it("rejects an empty string when present", () => {
      expect(() => parseServerEnv({ ...validBase, SUPABASE_SERVICE_ROLE_KEY: "" })).toThrowError(
        /SUPABASE_SERVICE_ROLE_KEY/,
      );
    });

    it("accepts a non-empty string", () => {
      const parsed = parseServerEnv({
        ...validBase,
        SUPABASE_SERVICE_ROLE_KEY: "service-role-jwt-token",
      });
      expect(parsed.SUPABASE_SERVICE_ROLE_KEY).toBe("service-role-jwt-token");
    });
  });

  describe("DATABASE_URL_POOLER", () => {
    it("is optional — absent does not throw", () => {
      const parsed = parseServerEnv(validBase);
      expect(parsed.DATABASE_URL_POOLER).toBeUndefined();
    });

    it("accepts a valid postgresql URL", () => {
      const url = "postgresql://postgres:secret@localhost:6543/postgres";
      const parsed = parseServerEnv({ ...validBase, DATABASE_URL_POOLER: url });
      expect(parsed.DATABASE_URL_POOLER).toBe(url);
    });

    it("rejects an invalid URL when present", () => {
      expect(() => parseServerEnv({ ...validBase, DATABASE_URL_POOLER: "not-a-url" })).toThrowError(
        /DATABASE_URL_POOLER/,
      );
    });
  });

  describe("DATABASE_URL_DIRECT", () => {
    it("is optional — absent does not throw", () => {
      const parsed = parseServerEnv(validBase);
      expect(parsed.DATABASE_URL_DIRECT).toBeUndefined();
    });

    it("accepts a valid postgresql URL", () => {
      const url = "postgresql://postgres:secret@localhost:5432/postgres";
      const parsed = parseServerEnv({ ...validBase, DATABASE_URL_DIRECT: url });
      expect(parsed.DATABASE_URL_DIRECT).toBe(url);
    });

    it("rejects an invalid URL when present", () => {
      expect(() => parseServerEnv({ ...validBase, DATABASE_URL_DIRECT: "not-a-url" })).toThrowError(
        /DATABASE_URL_DIRECT/,
      );
    });
  });

  describe("CRON_SECRET", () => {
    it("is optional — absent does not throw", () => {
      const parsed = parseServerEnv(validBase);
      expect(parsed.CRON_SECRET).toBeUndefined();
    });

    it("accepts a secret of exactly 16 characters", () => {
      const parsed = parseServerEnv({ ...validBase, CRON_SECRET: "a".repeat(16) });
      expect(parsed.CRON_SECRET).toBe("a".repeat(16));
    });

    it("rejects a secret shorter than 16 characters", () => {
      expect(() => parseServerEnv({ ...validBase, CRON_SECRET: "short" })).toThrowError(
        /CRON_SECRET/,
      );
    });
  });

  describe("VAPID server keys", () => {
    it("VAPID_PRIVATE_KEY is optional — absent does not throw", () => {
      const parsed = parseServerEnv(validBase);
      expect(parsed.VAPID_PRIVATE_KEY).toBeUndefined();
    });

    it("VAPID_SUBJECT is optional — absent does not throw", () => {
      const parsed = parseServerEnv(validBase);
      expect(parsed.VAPID_SUBJECT).toBeUndefined();
    });

    it("VAPID_SUBJECT rejects values that are not mailto: or https: URLs", () => {
      expect(() => parseServerEnv({ ...validBase, VAPID_SUBJECT: "not-valid" })).toThrowError(
        /VAPID_SUBJECT/,
      );
    });

    it("VAPID_SUBJECT accepts a mailto: value", () => {
      const parsed = parseServerEnv({
        ...validBase,
        VAPID_SUBJECT: "mailto:push@ambulante.app",
      });
      expect(parsed.VAPID_SUBJECT).toBe("mailto:push@ambulante.app");
    });

    it("VAPID_SUBJECT accepts an https: URL", () => {
      const parsed = parseServerEnv({
        ...validBase,
        VAPID_SUBJECT: "https://ambulante.app",
      });
      expect(parsed.VAPID_SUBJECT).toBe("https://ambulante.app");
    });
  });
});
