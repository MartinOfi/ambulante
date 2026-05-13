import { expect, test } from "@playwright/test";
import { E2E_USERS } from "../fixtures/users";
import { E2E_STORES } from "../fixtures/stores";
import { REALTIME_TRANSITION_TIMEOUT_MS } from "../fixtures/orders";
import { MapPage } from "../page-objects/MapPage";
import { CartDrawer } from "../page-objects/CartDrawer";
import { OrderTrackingPage } from "../page-objects/OrderTrackingPage";
import { StoreOrdersPage } from "../page-objects/StoreOrdersPage";

/**
 * UC-FLOW-02: Pedido rechazado por la tienda
 *
 * Cliente envía pedido → Tienda lo rechaza → Cliente ve RECHAZADO en tracking.
 */
test.describe("UC-FLOW-02 — pedido rechazado por la tienda", () => {
  test("tienda rechaza → cliente ve RECHAZADO", async ({ browser }) => {
    const clientContext = await browser.newContext({
      permissions: ["geolocation"],
      geolocation: E2E_STORES.approved.geo,
    });
    const clientPage = await clientContext.newPage();
    const storeContext = await browser.newContext();
    const storePage = await storeContext.newPage();

    try {
      // Cliente: login y envío de pedido
      await clientPage.goto("/login");
      await clientPage.getByLabel(/correo electrónico/i).fill(E2E_USERS.client.email);
      await clientPage.getByLabel(/contraseña/i).fill(E2E_USERS.client.password);
      await clientPage.getByRole("button", { name: /iniciar sesión|ingresar/i }).click();
      await clientPage.waitForURL("**/map**", { timeout: 15_000 });

      const map = new MapPage(clientPage);
      await map.expandBottomSheet();
      await map.openStoreDetail(E2E_STORES.approved.name);
      await map.addToCartButton(E2E_STORES.approved.product.name).click();
      await map.closeStoreDetail();

      const cart = new CartDrawer(clientPage);
      await cart.submitOrder();
      await clientPage.waitForURL("**/orders/**", { timeout: 20_000 });
      const clientTracking = new OrderTrackingPage(clientPage);
      await expect(clientTracking.statusStep("ENVIADO")).toBeVisible({ timeout: 8_000 });

      // Tienda: login y rechazar pedido
      await storePage.goto("/login");
      await storePage.getByLabel(/correo electrónico/i).fill(E2E_USERS.store.email);
      await storePage.getByLabel(/contraseña/i).fill(E2E_USERS.store.password);
      await storePage.getByRole("button", { name: /iniciar sesión|ingresar/i }).click();
      await storePage.waitForURL("**/store/**", { timeout: 15_000 });

      const storeOrders = new StoreOrdersPage(storePage);
      await storeOrders.goto();
      await expect(storeOrders.firstRejectButton).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
      await storeOrders.firstRejectButton.click();

      // Cliente: ve RECHAZADO
      await expect(clientTracking.statusStep("RECHAZADO")).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
    } finally {
      await clientContext.close();
      await storeContext.close();
    }
  });
});
