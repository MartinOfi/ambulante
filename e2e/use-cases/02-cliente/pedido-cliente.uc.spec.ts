import { expect, test } from "@playwright/test";
import { loginAsClient } from "../helpers";
import { MapPage } from "../page-objects/MapPage";
import { CartDrawer } from "../page-objects/CartDrawer";
import { OrderTrackingPage, OrderHistoryPage } from "../page-objects/OrderTrackingPage";
import { E2E_STORES } from "../fixtures/stores";
import { REALTIME_TRANSITION_TIMEOUT_MS } from "../fixtures/orders";

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
  await page.waitForURL("**/orders/**", { timeout: 20_000 });
}

// UC-CLI-09: Ver estado inicial del pedido (ENVIADO)
test.describe("UC-CLI-09 — estado ENVIADO del pedido", () => {
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

// UC-CLI-13: Confirmar que va en camino (cliente)
test.describe("UC-CLI-13 — confirmar EN_CAMINO por cliente", () => {
  test("botón confirmar camino transiciona a EN_CAMINO", async ({ page }) => {
    await submitOrderAndLand(page);
    const tracking = new OrderTrackingPage(page);
    await expect(tracking.confirmOnTheWayButton).toBeVisible({
      timeout: REALTIME_TRANSITION_TIMEOUT_MS,
    });
    await tracking.confirmOnTheWayButton.click();
    await expect(tracking.statusStep("EN_CAMINO")).toBeVisible({
      timeout: REALTIME_TRANSITION_TIMEOUT_MS,
    });
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

// UC-CLI-15: Ver pedido rechazado
test.describe("UC-CLI-15 — estado RECHAZADO", () => {
  test("pedido rechazado por tienda muestra estado RECHAZADO", async ({ page }) => {
    await submitOrderAndLand(page);
    const tracking = new OrderTrackingPage(page);
    await expect(tracking.statusStep("RECHAZADO")).toBeVisible({
      timeout: REALTIME_TRANSITION_TIMEOUT_MS,
    });
  });
});

// UC-CLI-16: Ver pedido expirado
test.describe("UC-CLI-16 — estado EXPIRADO (cron)", () => {
  test("después de llamar al cron el pedido pasa a EXPIRADO", async ({ page }) => {
    await submitOrderAndLand(page);
    const orderId = new URL(page.url()).pathname.split("/").pop();
    // Llamar al endpoint de cron directamente para forzar expiración
    await page.request.post("/api/cron/expire-orders");
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
    // Al menos un pedido existe en el historial seed
    await expect(page.getByRole("article").first()).toBeVisible({ timeout: 8_000 });
  });

  test("filtrar por estado CANCELADO filtra la lista", async ({ page }) => {
    await loginAsClient(page);
    const history = new OrderHistoryPage(page);
    await history.goto();
    await history.filterByStatus("CANCELADO");
    await expect(page.locator("[data-order-status='CANCELADO']").first()).toBeVisible({
      timeout: 5_000,
    });
  });
});
