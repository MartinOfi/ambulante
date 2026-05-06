import type { BrowserContext, Page } from "@playwright/test";
import { SESSION_COOKIE_NAME } from "@/shared/constants/auth";

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

/** Performs real Supabase authentication via the login page with seed credentials. */
export async function loginAsClient(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/correo electrónico/i).fill("cliente@dev.ambulante.local");
  await page.getByLabel(/contraseña/i).fill("Ambulante123!");
  await page.getByRole("button", { name: /iniciar sesión/i }).click();
  await page.waitForURL("**/map**", { timeout: 15_000 });
}
