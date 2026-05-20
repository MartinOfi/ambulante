import path from "path";
import { expect, test } from "@playwright/test";
import { E2E_STORES } from "../fixtures/stores";
import { resetApprovedStore } from "../fixtures/db";
import { REALTIME_TRANSITION_TIMEOUT_MS } from "../fixtures/orders";
import { MapPage } from "../page-objects/MapPage";
import { CartDrawer } from "../page-objects/CartDrawer";
import { OrderTrackingPage } from "../page-objects/OrderTrackingPage";
import { StoreOrdersPage } from "../page-objects/StoreOrdersPage";
import { StoreOrderDetailPage } from "../page-objects/StoreOrderDetailPage";

// UC-FLOW-01 a UC-FLOW-05 comparten CLIENT_AUTH y E2E_STORES.approved.
// Deben correr en serie en un único worker para evitar race conditions entre archivos.
test.describe.configure({ mode: "serial" });

const CLIENT_AUTH = path.join(__dirname, "../../.auth/client.json");
const STORE_AUTH = path.join(__dirname, "../../.auth/store.json");

/**
 * UC-FLOW-01: Happy path completo
 *
 * Cliente envía pedido → Tienda lo acepta → Cliente confirma en camino →
 * Tienda finaliza → ambos ven FINALIZADO
 */
test.describe("UC-FLOW-01 — happy path completo (cliente ↔ tienda)", () => {
  test.setTimeout(90_000);
  test.beforeEach(resetApprovedStore);

  test("pedido completo ENVIADO → ACEPTADO → EN_CAMINO → FINALIZADO", async ({ browser }) => {
    const clientContext = await browser.newContext({
      storageState: CLIENT_AUTH,
      permissions: ["geolocation"],
      geolocation: E2E_STORES.approved.geo,
    });
    const clientPage = await clientContext.newPage();
    const storeContext = await browser.newContext({ storageState: STORE_AUTH });
    const storePage = await storeContext.newPage();

    try {
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

      await expect(clientTracking.statusStep("ACEPTADO")).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
      await expect(clientTracking.confirmOnTheWayButton).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
      await clientTracking.confirmOnTheWayButton.click();
      await expect(clientTracking.statusStep("EN_CAMINO")).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });

      await expect(storeOrders.firstOrderCard).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
      await storeOrders.clickFirstOrder();
      await expect(storeDetail.finalizeButton).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
      await storeDetail.finalizeButton.click();
      await storePage.waitForURL("**/store/orders**", {
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
        waitUntil: "domcontentloaded",
      });

      await expect(clientTracking.statusStep("FINALIZADO")).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
    } finally {
      await clientContext.close();
      await storeContext.close();
    }
  });
});

/**
 * UC-FLOW-02: Pedido rechazado por la tienda
 *
 * Cliente envía pedido → Tienda lo rechaza → Cliente ve RECHAZADO en tracking.
 */
test.describe("UC-FLOW-02 — pedido rechazado por la tienda", () => {
  test.setTimeout(90_000);
  test.beforeEach(resetApprovedStore);

  test("tienda rechaza → cliente ve RECHAZADO", async ({ browser }) => {
    const clientContext = await browser.newContext({
      storageState: CLIENT_AUTH,
      permissions: ["geolocation"],
      geolocation: E2E_STORES.approved.geo,
    });
    const clientPage = await clientContext.newPage();
    const storeContext = await browser.newContext({ storageState: STORE_AUTH });
    const storePage = await storeContext.newPage();

    try {
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

      await expect(clientTracking.statusStep("RECHAZADO")).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
    } finally {
      await clientContext.close();
      await storeContext.close();
    }
  });
});

/**
 * UC-FLOW-03: Pedido cancelado por el cliente antes de ser aceptado
 *
 * El cliente puede cancelar en ENVIADO o RECIBIDO (pre-ACEPTADO).
 */
test.describe("UC-FLOW-03 — cliente cancela pedido antes de ACEPTADO", () => {
  test.setTimeout(60_000);
  test.beforeEach(resetApprovedStore);

  test("cliente cancela en estado ENVIADO → ve CANCELADO", async ({ browser }) => {
    const clientContext = await browser.newContext({
      storageState: CLIENT_AUTH,
      permissions: ["geolocation"],
      geolocation: E2E_STORES.approved.geo,
    });
    const clientPage = await clientContext.newPage();

    try {
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
  test.setTimeout(90_000);
  test.beforeEach(resetApprovedStore);

  test("botón cancelar desaparece tras ACEPTADO", async ({ browser }) => {
    const clientContext = await browser.newContext({
      storageState: CLIENT_AUTH,
      permissions: ["geolocation"],
      geolocation: E2E_STORES.approved.geo,
    });
    const clientPage = await clientContext.newPage();
    const storeContext = await browser.newContext({ storageState: STORE_AUTH });
    const storePage = await storeContext.newPage();

    try {
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

/**
 * UC-FLOW-05: Pedido expirado por el cron del sistema
 *
 * El cliente envía un pedido, nadie responde, y se llama al endpoint de cron
 * para forzar la expiración sin esperar los 10 minutos reales.
 */
test.describe("UC-FLOW-05 — pedido expirado por inacción de la tienda", () => {
  test.setTimeout(60_000);
  test.beforeEach(resetApprovedStore);

  test("cron expire-orders pasa pedido sin respuesta a EXPIRADO", async ({ browser }) => {
    const clientContext = await browser.newContext({
      storageState: CLIENT_AUTH,
      permissions: ["geolocation"],
      geolocation: E2E_STORES.approved.geo,
    });
    const clientPage = await clientContext.newPage();

    try {
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

      const tracking = new OrderTrackingPage(clientPage);
      await expect(tracking.statusStep("ENVIADO")).toBeVisible({ timeout: 8_000 });

      const expireResponse = await clientPage.request.post("/api/cron/expire-orders", {
        headers: { "x-e2e-expiration-minutes": "0" },
      });
      expect(expireResponse.ok(), `expire-orders HTTP ${expireResponse.status()}`).toBe(true);
      const expireBody = (await expireResponse.json()) as { count: number; auditFailures: number };
      expect(expireBody.count, `expire-orders claimed 0 orders`).toBeGreaterThan(0);

      await expect(tracking.statusStep("EXPIRADO")).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
    } finally {
      await clientContext.close();
    }
  });

  test("cron auto-close-orders cierra pedidos ACEPTADO abiertos más de 2h", async ({ browser }) => {
    const clientContext = await browser.newContext({
      storageState: CLIENT_AUTH,
      permissions: ["geolocation"],
      geolocation: E2E_STORES.approved.geo,
    });
    const clientPage = await clientContext.newPage();
    const storeContext = await browser.newContext({ storageState: STORE_AUTH });
    const storePage = await storeContext.newPage();

    try {
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

      const tracking = new OrderTrackingPage(clientPage);
      await expect(tracking.statusStep("ENVIADO")).toBeVisible({ timeout: 8_000 });

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

      await expect(tracking.statusStep("ACEPTADO")).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });

      const closeResponse = await clientPage.request.post("/api/cron/auto-close-orders", {
        headers: { "x-e2e-autoclose-hours": "-1" },
      });
      expect(closeResponse.ok(), `auto-close-orders HTTP ${closeResponse.status()}`).toBe(true);
      const closeBody = (await closeResponse.json()) as { count: number; auditFailures: number };
      expect(closeBody.count, `auto-close-orders claimed 0 orders`).toBeGreaterThan(0);

      await expect(tracking.statusStep("FINALIZADO")).toBeVisible({
        timeout: REALTIME_TRANSITION_TIMEOUT_MS,
      });
    } finally {
      await clientContext.close();
      await storeContext.close();
    }
  });
});
