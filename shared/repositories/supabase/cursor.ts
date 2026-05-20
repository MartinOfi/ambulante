import { z } from "zod";

// Cursor opaco para keyset pagination en orders. Codifica (created_at, id)
// de la última row de la página previa. Composición:
//   - createdAt: ISO timestamp del row pivote.
//   - id: bigint interno del row pivote (necesario para tie-break cuando
//     dos rows comparten created_at en el mismo milisegundo).
// Decode tolera basura: si el string no es un base64url válido o no parsea
// el schema, devuelve null y el caller lo trata como "primera página".
//
// Nota de portabilidad: usamos btoa/atob + TextEncoder/TextDecoder en vez de
// `Buffer.toString('base64url')`. El polyfill de Buffer en el browser no
// soporta el encoding `base64url` (introducido en Node 15) — falla con
// "Unknown encoding: base64url". btoa/atob son globals en browser y Node ≥16.

const cursorSchema = z
  .object({
    createdAt: z.string().datetime(),
    id: z.number().int().positive(),
  })
  .strict();

export type OrderHistoryCursor = z.infer<typeof cursorSchema>;

const BASE64_GROUP_SIZE = 4;

function utf8ToBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToUtf8(raw: string): string {
  const normalized = raw.replace(/-/g, "+").replace(/_/g, "/");
  const padNeeded =
    (BASE64_GROUP_SIZE - (normalized.length % BASE64_GROUP_SIZE)) % BASE64_GROUP_SIZE;
  const padded = normalized + "=".repeat(padNeeded);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function encodeOrderHistoryCursor(cursor: OrderHistoryCursor): string {
  return utf8ToBase64Url(JSON.stringify(cursor));
}

export function decodeOrderHistoryCursor(raw: string): OrderHistoryCursor | null {
  if (raw.length === 0) return null;
  try {
    const json = base64UrlToUtf8(raw);
    const parsed = cursorSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
