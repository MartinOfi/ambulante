import { z } from "zod";

const NODE_ENV_VALUES = ["development", "test", "production"];

const envSchema = z.object({
  NODE_ENV: z.enum(NODE_ENV_VALUES).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

/**
 * @typedef {z.infer<typeof envSchema>} Env
 */

/**
 * @param {Record<string, string | undefined>} rawEnv
 * @returns {Env}
 */
export function parseEnv(rawEnv) {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Configuración inválida de variables de entorno: ${issues}`,
    );
  }

  return Object.freeze(result.data);
}
