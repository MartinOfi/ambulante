import { expect, test, type BrowserContext } from "@playwright/test";
import { SESSION_COOKIE_NAME } from "@/shared/constants/auth";

// Uses store-demo-2 seed (orders.mock.ts) to avoid state conflicts with realtime.spec.ts
// which consumes the store-demo-1 RECIBIDO order.
const DEMO_CLIENT_ID = "demo-client-1";
const DEMO_STORE_ID = "store-demo-2";
const REALTIME_SLA_MS = 5_000;

function makeSessionCookie(role: "client" | "store", userId: string): string {
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

async function setSessionCookie(
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

// PRD §7.2 — propagation SLA: order state change must reach client in <5 s.
// Flow: (a) pre-seeded RECIBIDO order exists; (b) store accepts it; (c) client sees change in <5 s.
test("order acceptance propagates to client view within 5 s (PRD §7.2 SLA)", async ({
  browser,
}) => {
  const clientContext = await browser.newContext();
  const storeContext = await browser.newContext();

  try {
    await setSessionCookie(clientContext, "client", DEMO_CLIENT_ID);
    await setSessionCookie(storeContext, "store", DEMO_STORE_ID);

    const clientPage = await clientContext.newPage();
    const storePage = await storeContext.newPage();

    // Client filters orders to RECIBIDO — the B6.4 seed (Taco E2E B6.4) must be visible
    await clientPage.goto("/orders");
    await clientPage.waitForLoadState("networkidle");
    await clientPage.getByRole("button", { name: "Recibido" }).click();
    await expect(clientPage.locator('[data-order-status="RECIBIDO"]')).toHaveCount(1, {
      timeout: REALTIME_SLA_MS,
    });

    // Store navigates to inbox and accepts the pending order
    await storePage.goto("/store/orders");
    const acceptButton = storePage.getByRole("button", { name: "Aceptar" }).first();
    await expect(acceptButton).toBeVisible({ timeout: REALTIME_SLA_MS });

    const acceptedAt = Date.now();
    await acceptButton.click();

    // Client view must drop to 0 RECIBIDO cards within the SLA window
    await expect(clientPage.locator('[data-order-status="RECIBIDO"]')).toHaveCount(0, {
      timeout: REALTIME_SLA_MS,
    });

    // Explicit timing assertion: propagation must have occurred within REALTIME_SLA_MS
    expect(Date.now() - acceptedAt).toBeLessThan(REALTIME_SLA_MS);
  } finally {
    await clientContext.close();
    await storeContext.close();
  }
});
