import { z } from "zod";

function isAnyUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

const anyUrl = z.string().refine(isAnyUrl, { message: "Invalid URL" });

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
  DATABASE_URL_POOLER: anyUrl.optional(),
  DATABASE_URL_DIRECT: anyUrl.optional(),
  CRON_SECRET: z.string().min(16).optional(),
  VAPID_PUBLIC_KEY: z.string().min(1).optional(),
  VAPID_PRIVATE_KEY: z.string().min(1).optional(),
  VAPID_SUBJECT: z
    .string()
    .regex(/^(mailto:|https:\/\/)/, "debe ser una URL mailto: o https://")
    .optional(),
});

const serverEnvSchema = clientEnvSchema.merge(serverOnlyEnvSchema);

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type Env = ServerEnv;

function makeParser<TSchema extends z.ZodTypeAny>(schema: TSchema) {
  return function parse(rawEnv: Record<string, string | undefined>): z.infer<TSchema> {
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
export const parseServerEnv = makeParser(serverEnvSchema);
export const parseEnv = parseServerEnv;
