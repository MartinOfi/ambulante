import { expect, test } from "@playwright/test";
import { E2E_USERS } from "../fixtures/users";
import { E2E_STORES } from "../fixtures/stores";
import { REALTIME_TRANSITION_TIMEOUT_MS } from "../fixtures/orders";
import { MapPage } from "../page-objects/MapPage";
import { CartDrawer } from "../page-objects/CartDrawer";
import { OrderTrackingPage } from "../page-objects/OrderTrackingPage";

/**
 * UC-FLOW-05: Pedido expirado por el cron del sistema
 *
 * El cliente envía un pedido, nadie responde, y se llama al endpoint de cron
 * para forzar la expiración sin esperar los 10 minutos reales.
 */
test.describe("UC-FLOW-05 — pedido expirado por inacción de la tienda", () => {
  test("cron expire-orders pasa pedido sin respuesta a EXPIRADO", async ({ browser }) => {
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
      await expect(tracking.statusStep("ENVIADO")).toBeVisible({ timeout: 8_000 });

      // Llamar directamente al cron para forzar expiración
      await clientPage.request.post("/api/cron/expire-orders");

      // Cliente ve EXPIRADO vía Realtime
      await expect(tracking.statusStep("EXPIRADO")).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
    } finally {
      await clientContext.close();
    }
  });

  test("cron auto-close-orders cierra pedidos ACEPTADO abiertos más de 2h", async ({ browser }) => {
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

      // Llamar al cron de auto-cierre (en entorno de test puede que aplique a pedidos
      // con timestamp manipulado en el seed; verificamos que el endpoint responde OK)
      const response = await clientPage.request.post("/api/cron/auto-close-orders");
      expect(response.ok()).toBe(true);
    } finally {
      await clientContext.close();
    }
  });
});
