import { expect, test } from "@playwright/test";
import { loginAsClient } from "../helpers";
import { MapPage } from "../page-objects/MapPage";
import { E2E_STORES } from "../fixtures/stores";

const STORE_GEO = E2E_STORES.approved.geo;

test.use({
  permissions: ["geolocation"],
  geolocation: STORE_GEO,
});

// UC-CLI-01: Ver mapa con tiendas cercanas
test.describe("UC-CLI-01 — mapa con tiendas cercanas", () => {
  test("muestra canvas del mapa tras autenticarse", async ({ page }) => {
    await loginAsClient(page);
    const map = new MapPage(page);
    await expect(map.mapCanvas).toBeVisible({ timeout: 10_000 });
  });

  test("carga tiendas cercanas dentro de los límites del mapa", async ({ page }) => {
    await loginAsClient(page);
    const map = new MapPage(page);
    await expect(map.mapCanvas).toBeVisible({ timeout: 10_000 });
    // Hay al menos un marcador o card de tienda
    await expect(
      page
        .getByRole("button", { name: new RegExp(E2E_STORES.approved.name, "i") })
        .or(page.locator("[data-testid*='store-marker']").first()),
    ).toBeVisible({ timeout: 12_000 });
  });
});

// UC-CLI-02: Ver tiendas en bottom sheet
test.describe("UC-CLI-02 — bottom sheet de tiendas", () => {
  test("bottom sheet muestra la tienda aprobada cercana", async ({ page }) => {
    await loginAsClient(page);
    const map = new MapPage(page);
    await map.expandBottomSheet();
    await expect(
      page.getByRole("button", { name: new RegExp(E2E_STORES.approved.name, "i") }),
    ).toBeVisible({ timeout: 10_000 });
  });
});

// UC-CLI-03: Ver detalle de una tienda
test.describe("UC-CLI-03 — detalle de tienda", () => {
  test("abrir detalle muestra nombre y productos de la tienda", async ({ page }) => {
    await loginAsClient(page);
    const map = new MapPage(page);
    await map.expandBottomSheet();
    await map.openStoreDetail(E2E_STORES.approved.name);
    await expect(
      page.getByRole("dialog", { name: new RegExp(E2E_STORES.approved.name, "i") }),
    ).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(new RegExp(E2E_STORES.approved.product.name, "i"))).toBeVisible({
      timeout: 5_000,
    });
  });

  test("cerrar detalle vuelve al mapa", async ({ page }) => {
    await loginAsClient(page);
    const map = new MapPage(page);
    await map.expandBottomSheet();
    await map.openStoreDetail(E2E_STORES.approved.name);
    await map.closeStoreDetail();
    await expect(map.mapCanvas).toBeVisible({ timeout: 5_000 });
  });
});
