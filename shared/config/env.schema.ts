import { z } from "zod";

function isDatabaseUrl(s: string): boolean {
  try {
    const url = new URL(s);
    return url.protocol === "postgresql:" || url.protocol === "postgres:";
  } catch {
    return false;
  }
}

const databaseUrl = z
  .string()
  .refine(isDatabaseUrl, { message: "debe ser una URL postgresql:// o postgres://" });

const clientEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  NEXT_PUBLIC_MAP_STYLE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

// Only server-only vars — never expose these to the client bundle.
// DATABASE_URL_POOLER: PgBouncer transaction-mode (port 6543) for serverless Next.js functions.
// DATABASE_URL_DIRECT: direct Postgres (port 5432) for CLI migrations ONLY — no pooler.
const serverOnlyEnvSchema = z.object({
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  EDGE_CONFIG: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  DATABASE_URL_POOLER: databaseUrl.optional(),
  DATABASE_URL_DIRECT: databaseUrl.optional(),
  CRON_SECRET: z.string().min(16).optional(),
  SUPABASE_WEBHOOK_SECRET: z.string().min(16).optional(),
  VAPID_PUBLIC_KEY: z.string().min(1).optional(),
  VAPID_PRIVATE_KEY: z.string().min(1).optional(),
  VAPID_SUBJECT: z
    .string()
    .refine(
      (s) => {
        if (s.startsWith("mailto:")) {
          return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
        }
        if (s.startsWith("https://")) {
          try {
            new URL(s);
            return true;
          } catch {
            return false;
          }
        }
        return false;
      },
      { message: "debe ser un email (mailto:user@domain.com) o URL https://" },
    )
    .optional(),
});

const serverEnvSchema = clientEnvSchema.merge(serverOnlyEnvSchema).superRefine((data, ctx) => {
  if (data.NODE_ENV === "production" && data.NEXT_PUBLIC_APP_URL.startsWith("http://")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "NEXT_PUBLIC_APP_URL debe ser https:// en producción",
      path: ["NEXT_PUBLIC_APP_URL"],
    });
  }

  if (data.NEXT_PUBLIC_SUPABASE_URL && !data.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "NEXT_PUBLIC_SUPABASE_ANON_KEY es requerida cuando se configura NEXT_PUBLIC_SUPABASE_URL",
      path: ["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    });
  }

  const clientKey = data.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const serverKey = data.VAPID_PUBLIC_KEY;

  if (clientKey !== undefined || serverKey !== undefined) {
    if (clientKey !== serverKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "NEXT_PUBLIC_VAPID_PUBLIC_KEY y VAPID_PUBLIC_KEY deben ser iguales",
        path: ["VAPID_PUBLIC_KEY"],
      });
    }
    if (data.VAPID_PRIVATE_KEY === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "VAPID_PRIVATE_KEY es requerida cuando se configuran las claves VAPID",
        path: ["VAPID_PRIVATE_KEY"],
      });
    }
  }
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type Env = ServerEnv;

function makeParser<TSchema extends z.ZodTypeAny>(schema: TSchema) {
  return function parse(rawEnv: Record<string, string | undefined>): Readonly<z.infer<TSchema>> {
    const result = schema.safeParse(rawEnv);

    if (!result.success) {
      const issues = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new Error(`Configuración inválida de variables de entorno: ${issues}`);
    }

    return Object.freeze(result.data);
  };
}

export const parseClientEnv = makeParser(clientEnvSchema);
// Import parseServerEnv/parseEnv through shared/config/env.ts, not this file directly.
// env.ts carries `import "server-only"` which blocks Next.js from bundling it into the client.
export const parseServerEnv = makeParser(serverEnvSchema);
export const parseEnv = parseServerEnv;
