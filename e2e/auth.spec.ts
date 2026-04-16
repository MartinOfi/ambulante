import { expect, test, type BrowserContext } from "@playwright/test";

const SESSION_COOKIE_NAME = "ambulante-session";
const LOCALHOST_PORT = 3100;

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
    expect(page.url()).toContain("localhost:" + LOCALHOST_PORT + "/");
    expect(page.url()).not.toContain("/map");
  });

  test("redirects /store/dashboard to / without session cookie", async ({ page }) => {
    await page.goto("/store/dashboard");
    expect(page.url()).toContain("localhost:" + LOCALHOST_PORT + "/");
    expect(page.url()).not.toContain("/store");
  });

  test("redirects /admin/dashboard to / without session cookie", async ({ page }) => {
    await page.goto("/admin/dashboard");
    expect(page.url()).toContain("localhost:" + LOCALHOST_PORT + "/");
    expect(page.url()).not.toContain("/admin");
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
