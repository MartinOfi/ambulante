import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers";
import { AdminStoresPage } from "../page-objects/AdminPages";
import { E2E_STORES } from "../fixtures/stores";

// UC-ADM-02: Ver tiendas pendientes
test.describe("UC-ADM-02 — ver tiendas pendientes de validación", () => {
  test("pestaña pendientes muestra tiendas en espera", async ({ page }) => {
    await loginAsAdmin(page);
    const stores = new AdminStoresPage(page);
    await stores.goto();
    await stores.pendingTab.click();
    await expect(stores.storeRow(E2E_STORES.pending.name)).toBeVisible({ timeout: 10_000 });
  });
});

// UC-ADM-03: Buscar tienda por nombre
test.describe("UC-ADM-03 — buscar tienda por nombre", () => {
  test("buscar por nombre filtra la lista de tiendas", async ({ page }) => {
    await loginAsAdmin(page);
    const stores = new AdminStoresPage(page);
    await stores.goto();
    await stores.searchInput.fill(E2E_STORES.pending.name);
    await expect(stores.storeRow(E2E_STORES.pending.name)).toBeVisible({ timeout: 8_000 });
  });
});

// UC-ADM-04: Ver detalle de tienda pendiente
test.describe("UC-ADM-04 — ver detalle de tienda pendiente", () => {
  test("detalle muestra botones de aprobar y rechazar", async ({ page }) => {
    await loginAsAdmin(page);
    const stores = new AdminStoresPage(page);
    await stores.goto();
    await stores.pendingTab.click();
    await stores.viewStoreButton(E2E_STORES.pending.name).click();
    await expect(stores.approveButton).toBeVisible({ timeout: 8_000 });
    await expect(stores.rejectButton).toBeVisible();
  });
});

// UC-ADM-05: Aprobar tienda
test.describe("UC-ADM-05 — aprobar tienda", () => {
  test("aprobar tienda muestra toast de confirmación", async ({ page }) => {
    await loginAsAdmin(page);
    const stores = new AdminStoresPage(page);
    await stores.goto();
    await stores.pendingTab.click();
    await stores.viewStoreButton(E2E_STORES.pending.name).click();
    await stores.approveButton.click();
    await expect(stores.successToast).toBeVisible({ timeout: 10_000 });
    // La tienda ahora debe aparecer en la pestaña aprobadas
    await stores.goto();
    await stores.approvedTab.click();
    await expect(stores.storeRow(E2E_STORES.pending.name)).toBeVisible({ timeout: 8_000 });
  });
});

// UC-ADM-06: Rechazar tienda con motivo
test.describe("UC-ADM-06 — rechazar tienda con motivo", () => {
  test("motivo demasiado corto muestra error de validación", async ({ page }) => {
    await loginAsAdmin(page);
    const stores = new AdminStoresPage(page);
    await stores.goto();
    await stores.pendingTab.click();
    await stores.viewStoreButton(E2E_STORES.pending.name).click();
    await stores.rejectButton.click();
    await stores.rejectionReasonInput.fill("Corto");
    await stores.confirmRejectionButton.click();
    await expect(stores.rejectionReasonTooShortError).toBeVisible({ timeout: 3_000 });
  });

  test("rechazar con motivo válido muestra toast y mueve a rechazadas", async ({ page }) => {
    await loginAsAdmin(page);
    const stores = new AdminStoresPage(page);
    await stores.goto();
    await stores.pendingTab.click();
    await stores.viewStoreButton(E2E_STORES.pending.name).click();
    await stores.rejectButton.click();
    await stores.rejectionReasonInput.fill(
      "Documentación incompleta: falta habilitación municipal",
    );
    await stores.confirmRejectionButton.click();
    await expect(stores.successToast).toBeVisible({ timeout: 10_000 });
    await stores.goto();
    await stores.rejectedTab.click();
    await expect(stores.storeRow(E2E_STORES.pending.name)).toBeVisible({ timeout: 8_000 });
  });
});
