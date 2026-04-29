import type { BrowserContext } from "@playwright/test";
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
