import { z } from "zod";

// Cursor opaco para keyset pagination en orders. Codifica (created_at, id)
// de la última row de la página previa. Composición:
//   - createdAt: ISO timestamp del row pivote.
//   - id: bigint interno del row pivote (necesario para tie-break cuando
//     dos rows comparten created_at en el mismo milisegundo).
// Decode tolera basura: si el string no es un base64url válido o no parsea
// el schema, devuelve null y el caller lo trata como "primera página".

const cursorSchema = z
  .object({
    createdAt: z.string().datetime(),
    id: z.number().int().positive(),
  })
  .strict();

export type OrderHistoryCursor = z.infer<typeof cursorSchema>;

export function encodeOrderHistoryCursor(cursor: OrderHistoryCursor): string {
  const json = JSON.stringify(cursor);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeOrderHistoryCursor(raw: string): OrderHistoryCursor | null {
  if (raw.length === 0) return null;
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = cursorSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
