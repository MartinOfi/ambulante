import { expect, test, type BrowserContext } from "@playwright/test";
import { SESSION_COOKIE_NAME } from "@/shared/constants/auth";

const DEMO_CLIENT_ID = "demo-client-1";
const DEMO_STORE_ID = "store-demo-1";
const REALTIME_SLA_MS = 5_000;
const AVAILABILITY_SLA_MS = 2_000;

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

test("store accepting an order reflects in client view within 5 s (PRD §7.2)", async ({
  browser,
}) => {
  const clientContext = await browser.newContext();
  const storeContext = await browser.newContext();

  try {
    await setSessionCookie(clientContext, "client", DEMO_CLIENT_ID);
    await setSessionCookie(storeContext, "store", DEMO_STORE_ID);

    const clientPage = await clientContext.newPage();
    const storePage = await storeContext.newPage();

    // Load client orders and filter to RECIBIDO
    await clientPage.goto("/orders");
    await clientPage.waitForLoadState("networkidle");
    await clientPage.getByRole("button", { name: "Recibido" }).click();
    await expect(clientPage.locator('[data-order-status="RECIBIDO"]')).toHaveCount(1, {
      timeout: REALTIME_SLA_MS,
    });

    // Load store inbox — newest order (E2E seed) is first
    await storePage.goto("/store/orders");
    const firstAcceptButton = storePage.getByRole("button", { name: "Aceptar" }).first();
    await expect(firstAcceptButton).toBeVisible({ timeout: REALTIME_SLA_MS });
    await firstAcceptButton.click();

    // Client view must reflect ACEPTADO within the SLA — RECIBIDO card disappears
    await expect(clientPage.locator('[data-order-status="RECIBIDO"]')).toHaveCount(0, {
      timeout: REALTIME_SLA_MS,
    });
  } finally {
    await clientContext.close();
    await storeContext.close();
  }
});

test("store toggles availability → client map reflects change within 2 s (B6.3)", async ({
  browser,
}) => {
  const clientContext = await browser.newContext();
  const storeContext = await browser.newContext();

  try {
    await setSessionCookie(clientContext, "client", DEMO_CLIENT_ID);
    await setSessionCookie(storeContext, "store", DEMO_STORE_ID);

    const clientPage = await clientContext.newPage();
    const storePage = await storeContext.newPage();

    // Client opens the map — store marker should be visible (store starts available)
    await clientPage.goto("/map");
    await clientPage.waitForLoadState("networkidle");
    const storeMarker = clientPage.locator(`[data-store-id="${DEMO_STORE_ID}"]`);
    await expect(storeMarker).toBeVisible({ timeout: REALTIME_SLA_MS });

    // Store toggles availability to unavailable
    await storePage.goto("/store/dashboard");
    await storePage.waitForLoadState("networkidle");
    const toggleButton = storePage.getByRole("button", { name: /disponibilidad|availability/i });
    await expect(toggleButton).toBeVisible({ timeout: REALTIME_SLA_MS });
    await toggleButton.click();

    // Client map must hide the marker within 2 s (useStoresAvailabilityRealtime SLA)
    await expect(storeMarker).toBeHidden({ timeout: AVAILABILITY_SLA_MS });
  } finally {
    await clientContext.close();
    await storeContext.close();
  }
});
