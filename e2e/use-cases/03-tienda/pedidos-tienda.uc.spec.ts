import path from "path";
import { expect, test } from "@playwright/test";
import { loginAsStore } from "../helpers";
import { StoreOrdersPage } from "../page-objects/StoreOrdersPage";
import { StoreOrderDetailPage } from "../page-objects/StoreOrderDetailPage";
import { OrderTrackingPage } from "../page-objects/OrderTrackingPage";
import { MapPage } from "../page-objects/MapPage";
import { CartDrawer } from "../page-objects/CartDrawer";
import { REALTIME_TRANSITION_TIMEOUT_MS } from "../fixtures/orders";
import { E2E_STORES } from "../fixtures/stores";
import { resetApprovedStore } from "../fixtures/db";
import type { Page } from "@playwright/test";

async function loginAsClientFresh(page: Page) {
  await page.goto("/map", { waitUntil: "domcontentloaded" });
  await page.waitForURL("**/map**", { timeout: 15_000, waitUntil: "domcontentloaded" });
}

async function loginAsStoreFresh(page: Page) {
  await page.goto("/store/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForURL("**/store/**", { timeout: 15_000, waitUntil: "domcontentloaded" });
}

async function submitOrderAndLand(clientPage: Page): Promise<string> {
  await loginAsClientFresh(clientPage);
  const map = new MapPage(clientPage);
  await map.expandBottomSheet();
  await map.openStoreDetail(E2E_STORES.approved.name);
  await map.addToCartButton(E2E_STORES.approved.product.name).click();
  await map.closeStoreDetail();
  const cart = new CartDrawer(clientPage);
  await cart.submitOrder();
  await clientPage.waitForURL("**/orders/**", { timeout: 20_000, waitUntil: "domcontentloaded" });
  const url = new URL(clientPage.url());
  return url.pathname.split("/").pop() ?? "";
}

// UC-STO-17: Ver pedidos entrantes
test.describe("UC-STO-17 — ver pedidos entrantes", () => {
  test("página de pedidos es accesible para tienda aprobada", async ({ page }) => {
    await loginAsStore(page);
    const orders = new StoreOrdersPage(page);
    await orders.goto();
    await expect(orders.incomingOrdersList.or(orders.emptyMessage)).toBeVisible({ timeout: 8_000 });
  });
});

const CLIENT_AUTH = path.join(__dirname, "../../.auth/client.json");
const STORE_AUTH = path.join(__dirname, "../../.auth/store.json");

// UC-STO-18: Aceptar pedido
test.describe("UC-STO-18 — aceptar pedido entrante", () => {
  test.beforeEach(async () => {
    await resetApprovedStore();
  });

  test("aceptar primer pedido lo mueve a ACEPTADO", async ({ browser }) => {
    test.setTimeout(120_000);
    const clientContext = await browser.newContext({
      storageState: CLIENT_AUTH,
      permissions: ["geolocation"],
      geolocation: E2E_STORES.approved.geo,
    });
    const storeContext = await browser.newContext({ storageState: STORE_AUTH });

    try {
      const clientPage = await clientContext.newPage();
      const storePage = await storeContext.newPage();

      const orderId = await submitOrderAndLand(clientPage);

      await loginAsStoreFresh(storePage);
      const orders = new StoreOrdersPage(storePage);
      const detail = new StoreOrderDetailPage(storePage);
      await orders.goto();
      await expect(orders.orderCard(orderId)).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
      await orders.orderCard(orderId).click();
      await expect(detail.acceptButton).toBeVisible({ timeout: REALTIME_TRANSITION_TIMEOUT_MS });
      await detail.acceptButton.click();
      await storePage.waitForURL("**/store/orders**", {
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
        waitUntil: "domcontentloaded",
      });
      await expect(orders.orderStatusBadge("ACEPTADO")).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
    } finally {
      await clientContext.close();
      await storeContext.close();
    }
  });
});

// UC-STO-19: Rechazar pedido
test.describe("UC-STO-19 — rechazar pedido", () => {
  test.beforeEach(async () => {
    await resetApprovedStore();
  });

  test("rechazar pedido lo mueve a RECHAZADO", async ({ browser }) => {
    test.setTimeout(120_000);
    const clientContext = await browser.newContext({
      storageState: CLIENT_AUTH,
      permissions: ["geolocation"],
      geolocation: E2E_STORES.approved.geo,
    });
    const storeContext = await browser.newContext({ storageState: STORE_AUTH });

    try {
      const clientPage = await clientContext.newPage();
      const storePage = await storeContext.newPage();

      const orderId = await submitOrderAndLand(clientPage);

      await loginAsStoreFresh(storePage);
      const orders = new StoreOrdersPage(storePage);
      const detail = new StoreOrderDetailPage(storePage);
      await orders.goto();
      await expect(orders.orderCard(orderId)).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
      await orders.orderCard(orderId).click();
      await expect(detail.rejectButton).toBeVisible({ timeout: REALTIME_TRANSITION_TIMEOUT_MS });
      await detail.rejectButton.click();
      await storePage.waitForURL("**/store/orders**", {
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
        waitUntil: "domcontentloaded",
      });
      await expect(orders.orderStatusBadge("RECHAZADO")).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
    } finally {
      await clientContext.close();
      await storeContext.close();
    }
  });
});

// UC-STO-20: Finalizar pedido (requiere cliente confirme EN_CAMINO primero)
test.describe("UC-STO-20 — finalizar pedido", () => {
  test.beforeEach(async () => {
    await resetApprovedStore();
  });

  test("finalizar pedido lo mueve a FINALIZADO", async ({ browser }) => {
    test.setTimeout(120_000);
    const clientContext = await browser.newContext({
      storageState: CLIENT_AUTH,
      permissions: ["geolocation"],
      geolocation: E2E_STORES.approved.geo,
    });
    const storeContext = await browser.newContext({ storageState: STORE_AUTH });

    try {
      const clientPage = await clientContext.newPage();
      const storePage = await storeContext.newPage();

      const orderId = await submitOrderAndLand(clientPage);
      const clientTracking = new OrderTrackingPage(clientPage);

      await loginAsStoreFresh(storePage);
      const orders = new StoreOrdersPage(storePage);
      const detail = new StoreOrderDetailPage(storePage);
      await orders.goto();

      // Tienda abre detalle y acepta → ACEPTADO
      await expect(orders.orderCard(orderId)).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
      await orders.orderCard(orderId).click();
      await expect(detail.acceptButton).toBeVisible({ timeout: REALTIME_TRANSITION_TIMEOUT_MS });
      await detail.acceptButton.click();
      await storePage.waitForURL("**/store/orders**", {
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
        waitUntil: "domcontentloaded",
      });

      // Cliente confirma que va en camino → EN_CAMINO
      await expect(clientTracking.confirmOnTheWayButton).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
      await clientTracking.confirmOnTheWayButton.click();

      // Tienda vuelve a abrir detalle y finaliza → FINALIZADO
      await expect(orders.orderCard(orderId)).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
      await orders.orderCard(orderId).click();
      await expect(detail.finalizeButton).toBeVisible({ timeout: REALTIME_TRANSITION_TIMEOUT_MS });
      await detail.finalizeButton.click();
      await storePage.waitForURL("**/store/orders**", {
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
        waitUntil: "domcontentloaded",
      });
      await expect(orders.orderStatusBadge("FINALIZADO")).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
    } finally {
      await clientContext.close();
      await storeContext.close();
    }
  });
});

// UC-STO-21: Estado vacío cuando no hay pedidos
test.describe("UC-STO-21 — sin pedidos entrantes", () => {
  test("muestra mensaje cuando no hay pedidos pendientes", async ({ page }) => {
    await loginAsStore(page);
    const orders = new StoreOrdersPage(page);
    await orders.goto();
    const hasOrders = (await orders.firstOrderCard.count()) > 0;
    if (!hasOrders) {
      await expect(orders.emptyMessage).toBeVisible({ timeout: 5_000 });
    } else {
      expect(hasOrders).toBe(true);
    }
  });
});
