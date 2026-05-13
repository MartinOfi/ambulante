import { expect, test } from "@playwright/test";
import { E2E_USERS } from "../fixtures/users";
import { E2E_STORES } from "../fixtures/stores";
import { REALTIME_TRANSITION_TIMEOUT_MS } from "../fixtures/orders";
import { MapPage } from "../page-objects/MapPage";
import { CartDrawer } from "../page-objects/CartDrawer";
import { OrderTrackingPage } from "../page-objects/OrderTrackingPage";
import { StoreOrdersPage } from "../page-objects/StoreOrdersPage";
import { StoreOrderDetailPage } from "../page-objects/StoreOrderDetailPage";

/**
 * UC-FLOW-03: Pedido cancelado por el cliente antes de ser aceptado
 *
 * El cliente puede cancelar en ENVIADO o RECIBIDO (pre-ACEPTADO).
 */
test.describe("UC-FLOW-03 — cliente cancela pedido antes de ACEPTADO", () => {
  test("cliente cancela en estado ENVIADO → ve CANCELADO", async ({ browser }) => {
    const clientContext = await browser.newContext({
      permissions: ["geolocation"],
      geolocation: E2E_STORES.approved.geo,
    });
    const clientPage = await clientContext.newPage();

    try {
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

      const tracking = new OrderTrackingPage(clientPage);
      await expect(tracking.cancelButton).toBeVisible({ timeout: 8_000 });
      await tracking.cancelButton.click();
      await expect(tracking.statusStep("CANCELADO")).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
    } finally {
      await clientContext.close();
    }
  });
});

/**
 * UC-FLOW-04: Pedido cancelado por la tienda no está en el scope del cliente.
 * Verificamos que una vez ACEPTADO, el cliente ya no ve el botón de cancelar.
 */
test.describe("UC-FLOW-04 — cliente no puede cancelar pedido ACEPTADO", () => {
  test("botón cancelar desaparece tras ACEPTADO", async ({ browser }) => {
    const clientContext = await browser.newContext({
      permissions: ["geolocation"],
      geolocation: E2E_STORES.approved.geo,
    });
    const clientPage = await clientContext.newPage();
    const storeContext = await browser.newContext();
    const storePage = await storeContext.newPage();

    try {
      // Cliente: login y enviar pedido
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

      // Tienda: aceptar pedido desde detalle
      await storePage.goto("/login");
      await storePage.getByLabel(/correo electrónico/i).fill(E2E_USERS.store.email);
      await storePage.getByLabel(/contraseña/i).fill(E2E_USERS.store.password);
      await storePage.getByRole("button", { name: /iniciar sesión|ingresar/i }).click();
      await storePage.waitForURL("**/store/**", { timeout: 15_000 });

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
      await storePage.waitForURL("**/store/orders**", { timeout: REALTIME_TRANSITION_TIMEOUT_MS });

      // Cliente: botón cancelar debe desaparecer
      const tracking = new OrderTrackingPage(clientPage);
      await expect(tracking.statusStep("ACEPTADO")).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
      await expect(tracking.cancelButton).not.toBeVisible({ timeout: 5_000 });
    } finally {
      await clientContext.close();
      await storeContext.close();
    }
  });
});
