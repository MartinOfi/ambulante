import { expect, test } from "@playwright/test";
import { setSessionCookie } from "./helpers";

// Uses store-demo-2 seed (orders.mock.ts) to avoid state conflicts with realtime.spec.ts
// which consumes the store-demo-1 RECIBIDO order.
const DEMO_CLIENT_ID = "demo-client-1";
const DEMO_STORE_ID = "store-demo-2";
const REALTIME_SLA_MS = 5_000;

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

    // Client filters orders to RECIBIDO — capture current count (may be >1 if both
    // RECIBIDO seeds are still present when this spec runs before realtime.spec.ts).
    await clientPage.goto("/orders");
    await clientPage.waitForLoadState("networkidle");
    await clientPage.getByRole("button", { name: "Recibido" }).click();
    const recibidoLocator = clientPage.locator('[data-order-status="RECIBIDO"]');
    await expect(recibidoLocator.first()).toBeVisible({ timeout: REALTIME_SLA_MS });
    const countBefore = await recibidoLocator.count();

    // Store navigates to inbox and accepts the pending B6.4 order (Taco E2E B6.4)
    await storePage.goto("/store/orders");
    const acceptButton = storePage.getByRole("button", { name: "Aceptar" }).first();
    await expect(acceptButton).toBeVisible({ timeout: REALTIME_SLA_MS });
    await acceptButton.click();

    // Capture timestamp AFTER click resolves — measures only propagation latency
    const acceptedAt = Date.now();

    // Client view must drop by one RECIBIDO card within the SLA window
    await expect(recibidoLocator).toHaveCount(countBefore - 1, { timeout: REALTIME_SLA_MS });

    // Explicit timing assertion: propagation must have occurred within REALTIME_SLA_MS
    expect(Date.now() - acceptedAt).toBeLessThan(REALTIME_SLA_MS);
  } finally {
    await clientContext.close();
    await storeContext.close();
  }
});
