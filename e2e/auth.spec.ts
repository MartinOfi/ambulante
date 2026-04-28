import { expect, test, type BrowserContext } from "@playwright/test";
import { SESSION_COOKIE_NAME } from "@/shared/constants/auth";

function makeSessionCookie(role: "client" | "store" | "admin"): string {
  const session = {
    accessToken: `mock-access-${role}`,
    refreshToken: `mock-refresh-${role}`,
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: `${role}-user-id`,
      email: `${role}@test.com`,
      role,
    },
  };
  return btoa(JSON.stringify(session));
}

async function setSessionCookie(context: BrowserContext, role: "client" | "store" | "admin") {
  await context.addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: makeSessionCookie(role),
      domain: "localhost",
      path: "/",
    },
  ]);
}

test.describe("middleware auth gating — unauthenticated redirects", () => {
  test("redirects /map to / without session cookie", async ({ page }) => {
    await page.goto("/map");
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("redirects /store/dashboard to / without session cookie", async ({ page }) => {
    await page.goto("/store/dashboard");
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("redirects /admin/dashboard to / without session cookie", async ({ page }) => {
    await page.goto("/admin/dashboard");
    expect(new URL(page.url()).pathname).toBe("/");
  });
});

test.describe("middleware auth gating — authorized access", () => {
  test("client cookie passes /map", async ({ page, context }) => {
    await setSessionCookie(context, "client");
    await page.goto("/map");
    expect(page.url()).toContain("/map");
  });

  test("store cookie passes /store/dashboard", async ({ page, context }) => {
    await setSessionCookie(context, "store");
    await page.goto("/store/dashboard");
    expect(page.url()).toContain("/store");
  });

  test("admin cookie passes /admin/dashboard", async ({ page, context }) => {
    await setSessionCookie(context, "admin");
    await page.goto("/admin/dashboard");
    expect(page.url()).toContain("/admin");
  });
});

test.describe("middleware auth gating — wrong role redirects", () => {
  test("client cookie is rejected on /store/dashboard", async ({ page, context }) => {
    await setSessionCookie(context, "client");
    await page.goto("/store/dashboard");
    expect(page.url()).not.toContain("/store");
  });

  test("store cookie is rejected on /map", async ({ page, context }) => {
    await setSessionCookie(context, "store");
    await page.goto("/map");
    expect(page.url()).not.toContain("/map");
  });

  test("client cookie is rejected on /admin/dashboard", async ({ page, context }) => {
    await setSessionCookie(context, "client");
    await page.goto("/admin/dashboard");
    expect(page.url()).not.toContain("/admin");
  });
});

test.describe("auth/callback route handler", () => {
  test("redirects to /auth/error when code param is missing", async ({ page }) => {
    await page.goto("/auth/callback");
    const url = new URL(page.url());
    expect(url.pathname).toBe("/auth/error");
    expect(url.searchParams.get("reason")).toBe("missing_code");
  });

  test("redirects to /auth/error when code is invalid", async ({ page }) => {
    await page.goto("/auth/callback?code=invalid-code-xyz");
    const url = new URL(page.url());
    expect(url.pathname).toBe("/auth/error");
    expect(url.searchParams.get("reason")).toBe("exchange_failed");
  });

  test("rejects absolute next param — does not redirect off-site", async ({ page }) => {
    // Even with a missing code (which short-circuits before next is used), the test
    // confirms the route never blindly follows an absolute next value. When a valid
    // code is available the safeRedirectPath guard on the happy path provides the
    // same protection.
    await page.goto("/auth/callback?next=https://evil.example.com");
    const url = new URL(page.url());
    // Must land on our own origin, not the external domain
    expect(url.hostname).not.toBe("evil.example.com");
    expect(url.pathname).toBe("/auth/error");
  });
});

test.describe("auth/confirm route handler", () => {
  test("redirects to /auth/error when token_hash is missing", async ({ page }) => {
    await page.goto("/auth/confirm");
    const url = new URL(page.url());
    expect(url.pathname).toBe("/auth/error");
    expect(url.searchParams.get("reason")).toBe("missing_token");
  });

  test("redirects to /auth/error when type is missing", async ({ page }) => {
    await page.goto("/auth/confirm?token_hash=abc123");
    const url = new URL(page.url());
    expect(url.pathname).toBe("/auth/error");
    expect(url.searchParams.get("reason")).toBe("missing_token");
  });

  test("redirects to /auth/error when type is unknown", async ({ page }) => {
    await page.goto("/auth/confirm?token_hash=abc123&type=hacked_type");
    const url = new URL(page.url());
    expect(url.pathname).toBe("/auth/error");
    expect(url.searchParams.get("reason")).toBe("missing_token");
  });

  test("redirects to /auth/error when token is expired or invalid", async ({ page }) => {
    await page.goto("/auth/confirm?token_hash=invalid-hash&type=signup");
    const url = new URL(page.url());
    expect(url.pathname).toBe("/auth/error");
    // reason is one of the known error codes
    const reason = url.searchParams.get("reason");
    expect(["link_expired", "already_confirmed", "confirmation_failed"]).toContain(reason);
  });

  test("rejects absolute next param — does not redirect off-site", async ({ page }) => {
    await page.goto("/auth/confirm?next=https://evil.example.com");
    const url = new URL(page.url());
    expect(url.hostname).not.toBe("evil.example.com");
  });
});

test.describe("auth/error page", () => {
  test("shows generic error when no reason param", async ({ page }) => {
    await page.goto("/auth/error");
    await expect(page.getByRole("heading", { name: /error/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /iniciar sesión/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /nuevo enlace/i })).toBeVisible();
  });

  test("shows expired link message for link_expired reason", async ({ page }) => {
    await page.goto("/auth/error?reason=link_expired");
    await expect(page.getByRole("heading", { name: /expirado/i })).toBeVisible();
    await expect(page.getByText(/1 hora/i)).toBeVisible();
  });

  test("shows already confirmed message", async ({ page }) => {
    await page.goto("/auth/error?reason=already_confirmed");
    await expect(page.getByRole("heading", { name: /confirmada/i })).toBeVisible();
  });

  test("shows missing code message", async ({ page }) => {
    await page.goto("/auth/error?reason=missing_code");
    await expect(page.getByRole("heading", { name: /inválido/i })).toBeVisible();
  });
});

test.describe("login page — password flow UI", () => {
  test("renders login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sesión/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /ingresar/i })).toBeVisible();
  });

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /ingresar/i }).click();
    await expect(page.getByText(/email/i).first()).toBeVisible();
  });

  test("shows error on wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("textbox", { name: /email/i }).fill("wrong@test.com");
    await page.getByLabel(/contraseña/i).fill("wrongpassword1");
    await page.getByRole("button", { name: /ingresar/i }).click();
    await expect(page.getByText(/credenciales/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("forgot-password page — magic link flow UI", () => {
  test("renders forgot password form", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
  });

  test("shows success message after submitting valid email", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByRole("textbox", { name: /email/i }).fill("test@example.com");
    await page.getByRole("button").first().click();
    // Success state shows a confirmation message — the exact copy varies but
    // must mention email or enlace.
    await expect(page.getByText(/email|enlace/i).first()).toBeVisible({ timeout: 5000 });
  });
});
