import type { BrowserContext, Page } from "@playwright/test";
import { SESSION_COOKIE_NAME } from "@/shared/constants/auth";

/**
 * @deprecated Produces a base64-encoded mock payload, NOT a real Supabase JWT.
 * Middleware calls `supabase.auth.getUser()` server-side and rejects these cookies.
 * Use `loginAsClient` (or a store-equivalent) for any test that hits protected routes.
 */
export function makeSessionCookie(role: "client" | "store", userId: string): string {
  const session = {
    accessToken: `mock-access-${role}`,
    refreshToken: `mock-refresh-${role}`,
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: userId,
      email: `${role}@test.com`,
      role,
    },
  };
  return btoa(JSON.stringify(session));
}

/**
 * @deprecated Uses `makeSessionCookie` which produces an invalid JWT — middleware will reject it.
 * Use `loginAsClient` for E2E flows that require authenticated server-side rendering.
 */
export async function setSessionCookie(
  context: BrowserContext,
  role: "client" | "store",
  userId: string,
): Promise<void> {
  await context.addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: makeSessionCookie(role, userId),
      domain: "localhost",
      path: "/",
    },
  ]);
}

const E2E_CLIENT_EMAIL = process.env.E2E_CLIENT_EMAIL ?? "cliente@dev.ambulante.local";
const E2E_CLIENT_PASSWORD = process.env.E2E_CLIENT_PASSWORD ?? "Ambulante123!";

/** Performs real Supabase authentication via the login page with seed credentials. */
export async function loginAsClient(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/correo electrónico/i).fill(E2E_CLIENT_EMAIL);
  await page.getByLabel(/contraseña/i).fill(E2E_CLIENT_PASSWORD);
  await page.getByRole("button", { name: /iniciar sesión/i }).click();
  await page.waitForURL("**/map**", { timeout: 15_000 });
}
