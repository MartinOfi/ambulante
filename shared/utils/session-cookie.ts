import { sessionSchema } from "@/shared/schemas/user";
import type { Session } from "@/shared/types/user";
import { SESSION_COOKIE_MAX_AGE_SECONDS } from "@/shared/constants/auth";

// MOCK PHASE ONLY — this cookie is not signed or encrypted.
// Any client can forge a valid-looking session by encoding arbitrary JSON.
// Must be replaced with Supabase JWT verification (session.access_token) before production.
export function parseSessionCookie(cookieValue: string): Session | null {
  if (!cookieValue) return null;

  try {
    const json = atob(cookieValue);
    const parsed: unknown = JSON.parse(json);
    const result = sessionSchema.safeParse(parsed);
    if (!result.success) return null;

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (result.data.expiresAt < nowSeconds) return null;

    return result.data;
  } catch (err) {
    // Log type only — never log the cookie value (contains session data)
    console.warn("[session-cookie] parse error:", err instanceof Error ? err.message : "unknown");
    return null;
  }
}

export function serializeSessionCookie(session: Session): string {
  return btoa(JSON.stringify(session));
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  path: "/",
} as const;
