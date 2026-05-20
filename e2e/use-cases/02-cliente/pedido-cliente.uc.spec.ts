import path from "path";
import { expect, test } from "@playwright/test";
import { loginAsClient } from "../helpers";
import { MapPage } from "../page-objects/MapPage";
import { CartDrawer } from "../page-objects/CartDrawer";
import { OrderTrackingPage, OrderHistoryPage } from "../page-objects/OrderTrackingPage";
import { StoreOrdersPage } from "../page-objects/StoreOrdersPage";
import { StoreOrderDetailPage } from "../page-objects/StoreOrderDetailPage";
import { E2E_STORES } from "../fixtures/stores";
import { REALTIME_TRANSITION_TIMEOUT_MS } from "../fixtures/orders";

test.describe.configure({ mode: "serial" });

// Storage state cacheado por global-setup. Evita login UI fresh por test —
// dos browser.newContext() paralelos con signInWithPassword sobre cuentas
// distintas cuelgan de forma no-determinista cuando el cleanup del contexto
// anterior aún no terminó.
const CLIENT_AUTH = path.join(__dirname, "../../.auth/client.json");
const STORE_AUTH = path.join(__dirname, "../../.auth/store.json");

const STORE_GEO = E2E_STORES.approved.geo;

test.use({
  permissions: ["geolocation"],
  geolocation: STORE_GEO,
});

async function submitOrderAndLand(page: Parameters<typeof loginAsClient>[0]) {
  await loginAsClient(page);
  const map = new MapPage(page);
  await map.expandBottomSheet();
  await map.openStoreDetail(E2E_STORES.approved.name);
  await map.addToCartButton(E2E_STORES.approved.product.name).click();
  await map.closeStoreDetail();
  const cart = new CartDrawer(page);
  await cart.submitOrder();
  await page.waitForURL("**/orders/**", { timeout: 35_000, waitUntil: "domcontentloaded" });
}

// UC-CLI-09: Ver estado inicial del pedido (ENVIADO)
test.describe("UC-CLI-09 — estado ENVIADO del pedido", () => {
  test.setTimeout(60_000);
  test("página de tracking muestra paso ENVIADO activo", async ({ page }) => {
    await submitOrderAndLand(page);
    const tracking = new OrderTrackingPage(page);
    await expect(tracking.statusStep("ENVIADO")).toBeVisible({ timeout: 8_000 });
    await expect(tracking.currentStatusStep).toBeVisible();
  });
});

// UC-CLI-10: Cancelar pedido en estado ENVIADO
test.describe("UC-CLI-10 — cancelar pedido desde ENVIADO", () => {
  test("cancelar pedido muestra estado CANCELADO", async ({ page }) => {
    await submitOrderAndLand(page);
    const tracking = new OrderTrackingPage(page);
    await tracking.cancelButton.click();
    await expect(tracking.statusStep("CANCELADO")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/pedido cancelado/i)).toBeVisible({ timeout: 5_000 });
  });
});

// UC-CLI-11: Ver pedido en estado RECIBIDO (transición automática del sistema)
test.describe("UC-CLI-11 — estado RECIBIDO", () => {
  test("el sistema marca el pedido como RECIBIDO", async ({ page }) => {
    await submitOrderAndLand(page);
    const tracking = new OrderTrackingPage(page);
    await expect(tracking.statusStep("RECIBIDO")).toBeVisible({
      timeout: REALTIME_TRANSITION_TIMEOUT_MS,
    });
  });
});

// UC-CLI-12: Ver pedido en estado ACEPTADO
test.describe("UC-CLI-12 — estado ACEPTADO", () => {
  test("cuando la tienda acepta, el cliente ve ACEPTADO", async ({ page }) => {
    await submitOrderAndLand(page);
    const tracking = new OrderTrackingPage(page);
    await expect(tracking.statusStep("ACEPTADO")).toBeVisible({
      timeout: REALTIME_TRANSITION_TIMEOUT_MS,
    });
  });
});

// UC-CLI-13: Confirmar que va en camino (cliente) — requiere actor tienda para aceptar primero
test.describe("UC-CLI-13 — confirmar EN_CAMINO por cliente", () => {
  test("botón confirmar camino transiciona a EN_CAMINO", async ({ browser }) => {
    const clientContext = await browser.newContext({
      storageState: CLIENT_AUTH,
      permissions: ["geolocation"],
      geolocation: STORE_GEO,
    });
    const clientPage = await clientContext.newPage();
    const storeContext = await browser.newContext({ storageState: STORE_AUTH });
    const storePage = await storeContext.newPage();

    try {
      // Cliente: envío de pedido (sesión inyectada vía storageState)
      await clientPage.goto("/map", { waitUntil: "domcontentloaded" });
      await clientPage.waitForURL("**/map**", { timeout: 15_000, waitUntil: "domcontentloaded" });

      const map = new MapPage(clientPage);
      await map.expandBottomSheet();
      await map.openStoreDetail(E2E_STORES.approved.name);
      await map.addToCartButton(E2E_STORES.approved.product.name).click();
      await map.closeStoreDetail();

      const cart = new CartDrawer(clientPage);
      await cart.submitOrder();
      await clientPage.waitForURL("**/orders/**", {
        timeout: 20_000,
        waitUntil: "domcontentloaded",
      });

      const clientTracking = new OrderTrackingPage(clientPage);
      await expect(clientTracking.statusStep("ENVIADO")).toBeVisible({ timeout: 8_000 });

      // Tienda: navegación directa al dashboard (sesión inyectada vía storageState)
      await storePage.goto("/store/dashboard", { waitUntil: "domcontentloaded" });
      await storePage.waitForURL("**/store/**", { timeout: 15_000, waitUntil: "domcontentloaded" });

      const storeOrders = new StoreOrdersPage(storePage);
      const storeDetail = new StoreOrderDetailPage(storePage);
      await storeOrders.goto();
      await expect(storeOrders.firstOrderCard).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
      await storeOrders.clickFirstOrder();
      await expect(storeDetail.acceptButton).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
      await storeDetail.acceptButton.click();
      await storePage.waitForURL("**/store/orders**", {
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
        waitUntil: "domcontentloaded",
      });

      // Cliente: ve el botón de confirmación y lo pulsa
      await expect(clientTracking.confirmOnTheWayButton).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
      await clientTracking.confirmOnTheWayButton.click();
      await expect(clientTracking.statusStep("EN_CAMINO")).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
    } finally {
      await clientContext.close();
      await storeContext.close();
    }
  });
});

// UC-CLI-14: Ver pedido finalizado
test.describe("UC-CLI-14 — estado FINALIZADO", () => {
  test("pedido finalizado muestra paso FINALIZADO", async ({ page }) => {
    await submitOrderAndLand(page);
    const tracking = new OrderTrackingPage(page);
    await expect(tracking.statusStep("FINALIZADO")).toBeVisible({
      timeout: REALTIME_TRANSITION_TIMEOUT_MS,
    });
  });
});

// UC-CLI-15: Ver pedido rechazado — requiere actor tienda para rechazar
test.describe("UC-CLI-15 — estado RECHAZADO", () => {
  test("pedido rechazado por tienda muestra estado RECHAZADO", async ({ browser }) => {
    const clientContext = await browser.newContext({
      storageState: CLIENT_AUTH,
      permissions: ["geolocation"],
      geolocation: STORE_GEO,
    });
    const clientPage = await clientContext.newPage();
    const storeContext = await browser.newContext({ storageState: STORE_AUTH });
    const storePage = await storeContext.newPage();

    try {
      // Cliente: envío de pedido (sesión inyectada vía storageState)
      await clientPage.goto("/map", { waitUntil: "domcontentloaded" });
      await clientPage.waitForURL("**/map**", { timeout: 15_000, waitUntil: "domcontentloaded" });

      const map = new MapPage(clientPage);
      await map.expandBottomSheet();
      await map.openStoreDetail(E2E_STORES.approved.name);
      await map.addToCartButton(E2E_STORES.approved.product.name).click();
      await map.closeStoreDetail();

      const cart = new CartDrawer(clientPage);
      await cart.submitOrder();
      await clientPage.waitForURL("**/orders/**", {
        timeout: 20_000,
        waitUntil: "domcontentloaded",
      });

      const clientTracking = new OrderTrackingPage(clientPage);
      await expect(clientTracking.statusStep("ENVIADO")).toBeVisible({ timeout: 8_000 });

      // Tienda: navegación directa al dashboard (sesión inyectada vía storageState)
      await storePage.goto("/store/dashboard", { waitUntil: "domcontentloaded" });
      await storePage.waitForURL("**/store/**", { timeout: 15_000, waitUntil: "domcontentloaded" });

      const storeOrders = new StoreOrdersPage(storePage);
      const storeDetail = new StoreOrderDetailPage(storePage);
      await storeOrders.goto();
      await expect(storeOrders.firstOrderCard).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
      await storeOrders.clickFirstOrder();
      await expect(storeDetail.rejectButton).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
      await storeDetail.rejectButton.click();
      await storePage.waitForURL("**/store/orders**", {
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
        waitUntil: "domcontentloaded",
      });

      // Cliente: ve RECHAZADO vía Realtime
      await expect(clientTracking.statusStep("RECHAZADO")).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
    } finally {
      await clientContext.close();
      await storeContext.close();
    }
  });
});

// UC-CLI-16: Ver pedido expirado
test.describe("UC-CLI-16 — estado EXPIRADO (cron)", () => {
  test("después de llamar al cron el pedido pasa a EXPIRADO", async ({ page }) => {
    await submitOrderAndLand(page);
    await page.request.post("/api/cron/expire-orders", {
      headers: { "x-e2e-expiration-minutes": "0" },
    });
    const tracking = new OrderTrackingPage(page);
    await expect(tracking.statusStep("EXPIRADO")).toBeVisible({
      timeout: REALTIME_TRANSITION_TIMEOUT_MS,
    });
  });
});

// UC-CLI-17: Historial de pedidos del cliente
test.describe("UC-CLI-17 — historial de pedidos", () => {
  test("historial muestra pedidos anteriores del cliente", async ({ page }) => {
    await loginAsClient(page);
    const history = new OrderHistoryPage(page);
    await history.goto();
    await history.waitForReady();
    await expect(page.getByRole("article").first()).toBeVisible({ timeout: 15_000 });
  });

  test("filtrar por estado CANCELADO filtra la lista", async ({ page }) => {
    await loginAsClient(page);
    const history = new OrderHistoryPage(page);
    await history.goto();
    await history.waitForReady();
    await history.filterByStatus("CANCELADO");
    await expect(page.locator("[data-order-status='CANCELADO']").first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
