import { expect, test, type BrowserContext } from "@playwright/test";
import { SESSION_COOKIE_NAME } from "@/shared/constants/auth";

const DEMO_CLIENT_ID = "demo-client-1";
const DEMO_STORE_ID = "store-demo-1";
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
