import { expect, test, type APIRequestContext } from "@playwright/test";
import { setSessionCookie } from "./helpers";

const DEMO_CLIENT_ID = "demo-client-1";
const DEMO_STORE_ID = "store-demo-1";
const PUSH_DELIVERY_SLA_MS = 5_000;
const PUSH_POLL_INTERVAL_MS = 200;
const ORDER_PRICE_ARS = 1_100;
const ORDER_QUANTITY = 1;

const PUSH_CAPTURE_PATH = "/api/__e2e/push-capture";
const ORDER_TEST_PATH = "/api/__e2e/order";

const ACCEPTED_TITLE_PATTERN = /aceptado/i;
const ORDER_ID_TRUNCATE_LENGTH = 8;

function formatOrderIdForDom(orderId: string): string {
  return orderId.length > ORDER_ID_TRUNCATE_LENGTH
    ? `...${orderId.slice(-ORDER_ID_TRUNCATE_LENGTH)}`
    : orderId;
}

interface CapturedPush {
  readonly userId: string;
  readonly payload: { readonly title: string; readonly body: string };
  readonly capturedAt: number;
}

interface CaptureResponse {
  readonly captures: ReadonlyArray<CapturedPush>;
}

async function clearCaptures(request: APIRequestContext): Promise<void> {
  const res = await request.delete(PUSH_CAPTURE_PATH);
  expect(res.ok()).toBeTruthy();
}

async function subscribeClient(request: APIRequestContext, userId: string): Promise<void> {
  const res = await request.post(PUSH_CAPTURE_PATH, {
    data: { action: "subscribe", userId },
  });
  expect(res.ok()).toBeTruthy();
}

async function createReceivedOrder(
  request: APIRequestContext,
  productName: string,
): Promise<string> {
  const res = await request.post(ORDER_TEST_PATH, {
    data: {
      clientId: DEMO_CLIENT_ID,
      storeId: DEMO_STORE_ID,
      items: [
        {
          productId: `e2e-${Date.now()}`,
          productName,
          productPriceArs: ORDER_PRICE_ARS,
          quantity: ORDER_QUANTITY,
        },
      ],
    },
  });
  expect(res.status()).toBe(201);
  const body: { readonly orderId: string } = await res.json();
  expect(body.orderId).toBeTruthy();
  return body.orderId;
}

async function fetchCaptures(
  request: APIRequestContext,
  userId: string,
): Promise<ReadonlyArray<CapturedPush>> {
  const res = await request.get(`${PUSH_CAPTURE_PATH}?userId=${encodeURIComponent(userId)}`);
  expect(res.ok()).toBeTruthy();
  const body: CaptureResponse = await res.json();
  return body.captures;
}

// PRD §7 / fase B8 — full push delivery loop:
// (a) client logged in; (b) subscribed to push; (c) order submitted (RECIBIDO);
// (d) store logged in (separate context); (e) store accepts; (f) client receives push.
test("push delivery loop: store accept dispatches push to subscribed client", async ({
  browser,
  request,
}) => {
  const productName = `Push E2E B8.4 — ${Date.now()}`;

  await clearCaptures(request);
  await subscribeClient(request, DEMO_CLIENT_ID);
  const orderId = await createReceivedOrder(request, productName);
  const orderIdForDom = formatOrderIdForDom(orderId);

  const clientContext = await browser.newContext();
  const storeContext = await browser.newContext();

  try {
    await setSessionCookie(clientContext, "client", DEMO_CLIENT_ID);
    await setSessionCookie(storeContext, "store", DEMO_STORE_ID);

    const storePage = await storeContext.newPage();
    await storePage.goto("/store/orders");
    await storePage.waitForLoadState("networkidle");

    const orderRow = storePage.locator("li", { hasText: orderIdForDom }).first();
    await expect(orderRow).toBeVisible({ timeout: PUSH_DELIVERY_SLA_MS });
    const acceptButton = orderRow.getByRole("button", { name: "Aceptar" });
    await expect(acceptButton).toBeVisible({ timeout: PUSH_DELIVERY_SLA_MS });
    await acceptButton.click();

    await expect
      .poll(
        async () => {
          const captures = await fetchCaptures(request, DEMO_CLIENT_ID);
          return captures.length;
        },
        {
          intervals: [PUSH_POLL_INTERVAL_MS],
          timeout: PUSH_DELIVERY_SLA_MS,
        },
      )
      .toBeGreaterThan(0);

    const captures = await fetchCaptures(request, DEMO_CLIENT_ID);
    const accepted = captures.find((c) => ACCEPTED_TITLE_PATTERN.test(c.payload.title));
    expect(accepted).toBeDefined();
    expect(accepted?.userId).toBe(DEMO_CLIENT_ID);
    expect(accepted?.payload.body.length).toBeGreaterThan(0);
  } finally {
    await clientContext.close();
    await storeContext.close();
  }
});
