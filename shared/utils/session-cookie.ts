import { sessionSchema } from "@/shared/schemas/user";
import type { Session } from "@/shared/types/user";
import { SESSION_COOKIE_MAX_AGE_SECONDS, SESSION_COOKIE_NAME } from "@/shared/constants/auth";
import { logger } from "@/shared/utils/logger";

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
    logger.warn("[session-cookie] parse error", {
      message: err instanceof Error ? err.message : "unknown",
    });
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

// Builds the Set-Cookie string from SESSION_COOKIE_OPTIONS so options stay in one place.
// httpOnly is excluded — JS `document.cookie` silently ignores it.
function buildCookieString(value: string): string {
  const { sameSite, path, maxAge, secure } = SESSION_COOKIE_OPTIONS;
  const sameSiteHeader = (sameSite.charAt(0).toUpperCase() + sameSite.slice(1)) as Capitalize<
    typeof sameSite
  >;
  const parts = [
    `${SESSION_COOKIE_NAME}=${value}`,
    `Path=${path}`,
    `Max-Age=${maxAge}`,
    `SameSite=${sameSiteHeader}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

// MOCK PHASE ONLY — sets the session cookie from the browser (httpOnly is ignored by JS,
// so the cookie won't be httpOnly, but the middleware can still read it server-side).
// Replace with a server action or API route when Supabase lands.
export function writeSessionCookie(session: Session): void {
  if (typeof document === "undefined") return;
  document.cookie = buildCookieString(serializeSessionCookie(session));
}

export function clearSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE_NAME}=; Path=${SESSION_COOKIE_OPTIONS.path}; Max-Age=0`;
}
