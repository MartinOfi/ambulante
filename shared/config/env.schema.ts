import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  NEXT_PUBLIC_MAP_STYLE_URL: z.string().url().optional(),
  EDGE_CONFIG: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(rawEnv: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Configuración inválida de variables de entorno: ${issues}`);
  }

  return Object.freeze(result.data);
}
