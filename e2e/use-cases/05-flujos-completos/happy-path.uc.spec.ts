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
 * UC-FLOW-01: Happy path completo
 *
 * Cliente envía pedido → Tienda lo acepta → Cliente confirma en camino →
 * Tienda finaliza → ambos ven FINALIZADO
 *
 * Usa dos contextos de browser en paralelo para simular cliente y tienda
 * operando simultáneamente.
 */
test.describe("UC-FLOW-01 — happy path completo (cliente ↔ tienda)", () => {
  test("pedido completo ENVIADO → ACEPTADO → EN_CAMINO → FINALIZADO", async ({ browser }) => {
    // ── Contexto cliente ──────────────────────────────────────────────────────
    const clientContext = await browser.newContext({
      permissions: ["geolocation"],
      geolocation: E2E_STORES.approved.geo,
    });
    const clientPage = await clientContext.newPage();

    // ── Contexto tienda ───────────────────────────────────────────────────────
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

      // Tienda: login, abrir detalle y aceptar pedido
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

      // Cliente: ve ACEPTADO
      await expect(clientTracking.statusStep("ACEPTADO")).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });

      // Cliente: confirma que va en camino
      await expect(clientTracking.confirmOnTheWayButton).toBeVisible({ timeout: 5_000 });
      await clientTracking.confirmOnTheWayButton.click();
      await expect(clientTracking.statusStep("EN_CAMINO")).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });

      // Tienda: abrir detalle y finalizar el pedido
      await expect(storeOrders.firstOrderCard).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
      await storeOrders.clickFirstOrder();
      await expect(storeDetail.finalizeButton).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
      await storeDetail.finalizeButton.click();
      await storePage.waitForURL("**/store/orders**", { timeout: REALTIME_TRANSITION_TIMEOUT_MS });

      // Cliente: ve FINALIZADO
      await expect(clientTracking.statusStep("FINALIZADO")).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
    } finally {
      await clientContext.close();
      await storeContext.close();
    }
  });
});
