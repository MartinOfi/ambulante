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

  it("does not enforce https:// in production — that check is server-only", () => {
    const parsed = parseClientEnv({
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "http://ambulante.app",
    });
    expect(parsed.NEXT_PUBLIC_APP_URL).toBe("http://ambulante.app");
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

    it("accepts a valid URL when ANON_KEY is also present", () => {
      const parsed = parseServerEnv({
        ...validBase,
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
      });
      expect(parsed.NEXT_PUBLIC_SUPABASE_URL).toBe("http://localhost:54321");
    });

    it("rejects URL without ANON_KEY (pair required together)", () => {
      expect(() =>
        parseServerEnv({ ...validBase, NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321" }),
      ).toThrowError(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
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

    it("accepts a postgres:// alias URL", () => {
      const url = "postgres://postgres:secret@localhost:6543/postgres";
      const parsed = parseServerEnv({ ...validBase, DATABASE_URL_POOLER: url });
      expect(parsed.DATABASE_URL_POOLER).toBe(url);
    });

    it("rejects an invalid URL when present", () => {
      expect(() => parseServerEnv({ ...validBase, DATABASE_URL_POOLER: "not-a-url" })).toThrowError(
        /DATABASE_URL_POOLER/,
      );
    });

    it("rejects a non-postgresql URL scheme", () => {
      expect(() =>
        parseServerEnv({ ...validBase, DATABASE_URL_POOLER: "http://localhost:6543/postgres" }),
      ).toThrowError(/DATABASE_URL_POOLER/);
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

    it("accepts a postgres:// alias URL", () => {
      const url = "postgres://postgres:secret@localhost:5432/postgres";
      const parsed = parseServerEnv({ ...validBase, DATABASE_URL_DIRECT: url });
      expect(parsed.DATABASE_URL_DIRECT).toBe(url);
    });

    it("rejects an invalid URL when present", () => {
      expect(() => parseServerEnv({ ...validBase, DATABASE_URL_DIRECT: "not-a-url" })).toThrowError(
        /DATABASE_URL_DIRECT/,
      );
    });

    it("rejects a non-postgresql URL scheme", () => {
      expect(() =>
        parseServerEnv({ ...validBase, DATABASE_URL_DIRECT: "http://localhost:5432/postgres" }),
      ).toThrowError(/DATABASE_URL_DIRECT/);
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

    it("VAPID_SUBJECT rejects https:// with no host", () => {
      expect(() => parseServerEnv({ ...validBase, VAPID_SUBJECT: "https://" })).toThrowError(
        /VAPID_SUBJECT/,
      );
    });

    it("VAPID_SUBJECT rejects mailto: with no address", () => {
      expect(() => parseServerEnv({ ...validBase, VAPID_SUBJECT: "mailto:" })).toThrowError(
        /VAPID_SUBJECT/,
      );
    });

    it("VAPID_SUBJECT accepts a mailto: address with subdomain and tag", () => {
      const parsed = parseServerEnv({
        ...validBase,
        VAPID_SUBJECT: "mailto:push+tag@mail.ambulante.app",
      });
      expect(parsed.VAPID_SUBJECT).toBe("mailto:push+tag@mail.ambulante.app");
    });
  });

  describe("production URL enforcement", () => {
    it("rejects http:// NEXT_PUBLIC_APP_URL in production", () => {
      expect(() =>
        parseServerEnv({ NODE_ENV: "production", NEXT_PUBLIC_APP_URL: "http://ambulante.app" }),
      ).toThrowError(/NEXT_PUBLIC_APP_URL/);
    });

    it("accepts https:// NEXT_PUBLIC_APP_URL in production", () => {
      const parsed = parseServerEnv({
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://ambulante.app",
      });
      expect(parsed.NEXT_PUBLIC_APP_URL).toBe("https://ambulante.app");
    });

    it("allows http:// NEXT_PUBLIC_APP_URL in development", () => {
      const parsed = parseServerEnv({
        NODE_ENV: "development",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      });
      expect(parsed.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    });
  });

  describe("VAPID key parity", () => {
    const publicKey = "BPublicKeyBase64Placeholder==";

    it("passes when no VAPID keys are set (feature disabled)", () => {
      const parsed = parseServerEnv(validBase);
      expect(parsed.NEXT_PUBLIC_VAPID_PUBLIC_KEY).toBeUndefined();
      expect(parsed.VAPID_PUBLIC_KEY).toBeUndefined();
    });

    it("passes when both public keys match and VAPID_PRIVATE_KEY is present", () => {
      const parsed = parseServerEnv({
        ...validBase,
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: publicKey,
        VAPID_PUBLIC_KEY: publicKey,
        VAPID_PRIVATE_KEY: "private-key",
      });
      expect(parsed.NEXT_PUBLIC_VAPID_PUBLIC_KEY).toBe(publicKey);
      expect(parsed.VAPID_PUBLIC_KEY).toBe(publicKey);
    });

    it("throws when NEXT_PUBLIC_VAPID_PUBLIC_KEY is set but VAPID_PUBLIC_KEY is not", () => {
      expect(() =>
        parseServerEnv({ ...validBase, NEXT_PUBLIC_VAPID_PUBLIC_KEY: publicKey }),
      ).toThrowError(/VAPID/);
    });

    it("throws when VAPID_PUBLIC_KEY is set but NEXT_PUBLIC_VAPID_PUBLIC_KEY is not", () => {
      expect(() => parseServerEnv({ ...validBase, VAPID_PUBLIC_KEY: publicKey })).toThrowError(
        /VAPID/,
      );
    });

    it("throws when both public keys are set but not equal", () => {
      expect(() =>
        parseServerEnv({
          ...validBase,
          NEXT_PUBLIC_VAPID_PUBLIC_KEY: "key-A",
          VAPID_PUBLIC_KEY: "key-B",
          VAPID_PRIVATE_KEY: "private-key",
        }),
      ).toThrowError(/VAPID_PUBLIC_KEY/);
    });

    it("throws when both public keys match but VAPID_PRIVATE_KEY is missing", () => {
      expect(() =>
        parseServerEnv({
          ...validBase,
          NEXT_PUBLIC_VAPID_PUBLIC_KEY: publicKey,
          VAPID_PUBLIC_KEY: publicKey,
        }),
      ).toThrowError(/VAPID_PRIVATE_KEY/);
    });
  });
});
