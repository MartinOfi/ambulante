import { expect, test } from "@playwright/test";
import { loginAsClient } from "../helpers";
import { MapPage } from "../page-objects/MapPage";
import { CartDrawer } from "../page-objects/CartDrawer";
import { E2E_STORES } from "../fixtures/stores";

const STORE_GEO = E2E_STORES.approved.geo;
const PRODUCT = E2E_STORES.approved.product;

test.use({
  permissions: ["geolocation"],
  geolocation: STORE_GEO,
});

async function openStoreAndAddProduct(page: Parameters<typeof loginAsClient>[0]) {
  await loginAsClient(page);
  const map = new MapPage(page);
  await map.expandBottomSheet();
  await map.openStoreDetail(E2E_STORES.approved.name);
  await map.addToCartButton(PRODUCT.name).click();
}

// UC-CLI-04: Agregar producto al carrito
test.describe("UC-CLI-04 — agregar producto al carrito", () => {
  test("agregar producto muestra resumen del carrito", async ({ page }) => {
    await openStoreAndAddProduct(page);
    const map = new MapPage(page);
    await map.closeStoreDetail();
    const cart = new CartDrawer(page);
    await expect(cart.cartSummary).toBeVisible({ timeout: 5_000 });
  });
});

// UC-CLI-05: Modificar cantidad de un producto en el carrito
test.describe("UC-CLI-05 — modificar cantidad en carrito", () => {
  test("incrementar cantidad actualiza el total", async ({ page }) => {
    await openStoreAndAddProduct(page);
    const map = new MapPage(page);
    await map.closeStoreDetail();
    const cart = new CartDrawer(page);
    const priceBefore = await cart.totalPrice.textContent();
    await cart.increaseButton(PRODUCT.name).click();
    const priceAfter = await cart.totalPrice.textContent();
    expect(priceAfter).not.toBe(priceBefore);
  });

  test("decrementar a cero elimina el ítem del carrito", async ({ page }) => {
    await openStoreAndAddProduct(page);
    const map = new MapPage(page);
    await map.closeStoreDetail();
    const cart = new CartDrawer(page);
    await cart.decreaseButton(PRODUCT.name).click();
    await expect(cart.itemRow(PRODUCT.name)).not.toBeVisible({ timeout: 3_000 });
  });
});

// UC-CLI-06: Quitar producto del carrito
test.describe("UC-CLI-06 — eliminar producto del carrito", () => {
  test("botón eliminar quita el ítem", async ({ page }) => {
    await openStoreAndAddProduct(page);
    const map = new MapPage(page);
    await map.closeStoreDetail();
    const cart = new CartDrawer(page);
    await cart.removeButton(PRODUCT.name).click();
    await expect(cart.itemRow(PRODUCT.name)).not.toBeVisible({ timeout: 3_000 });
  });
});

// UC-CLI-07: Vaciar carrito
test.describe("UC-CLI-07 — vaciar carrito completo", () => {
  test("vaciar carrito oculta el resumen", async ({ page }) => {
    await openStoreAndAddProduct(page);
    const map = new MapPage(page);
    await map.closeStoreDetail();
    const cart = new CartDrawer(page);
    await cart.clearCartButton.click();
    await expect(cart.cartSummary).not.toBeVisible({ timeout: 3_000 });
  });
});

// UC-CLI-08: Enviar pedido desde el carrito
test.describe("UC-CLI-08 — enviar pedido desde carrito", () => {
  test("confirmar carrito navega al tracking del pedido", async ({ page }) => {
    await openStoreAndAddProduct(page);
    const map = new MapPage(page);
    await map.closeStoreDetail();
    const cart = new CartDrawer(page);
    await cart.submitOrder();
    await page.waitForURL("**/orders/**", { timeout: 20_000 });
    expect(new URL(page.url()).pathname).toMatch(/^\/orders\/[^/]+$/);
  });
});
