import { expect, test } from "@playwright/test";
import { E2E_USERS } from "../fixtures/users";
import { ONBOARDING_DATA } from "../fixtures/stores";
import { StoreOnboardingPage } from "../page-objects/StoreOnboardingPage";
import { AdminStoresPage } from "../page-objects/AdminPages";
import { StoreDashboardPage } from "../page-objects/StoreDashboardPage";

/**
 * UC-FLOW-06: Alta completa de tienda
 *
 * Nueva cuenta de tienda completa el wizard de onboarding → queda en estado pendiente →
 * Admin la aprueba → la tienda puede acceder al dashboard operativo.
 *
 * Usa dos contextos: uno para la nueva tienda, otro para el admin.
 */
test.describe("UC-FLOW-06 — alta completa de tienda: onboarding → aprobación admin → dashboard", () => {
  test("tienda nueva completa onboarding y admin la aprueba", async ({ browser }) => {
    const storeContext = await browser.newContext();
    const storePage = await storeContext.newPage();
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    // Nombre único por ejecución para no chocar con datos de runs anteriores
    const uniqueName = `Tacos María ${Date.now()}`;

    try {
      // ── Paso 1: Tienda nueva completa el onboarding ───────────────────────
      await storePage.goto("/login");
      await storePage.getByLabel(/correo electrónico/i).fill(E2E_USERS.storePending.email);
      await storePage.getByLabel(/contraseña/i).fill(E2E_USERS.storePending.password);
      await storePage.getByRole("button", { name: /iniciar sesión|ingresar/i }).click();
      // La tienda pendiente llega al wizard o a la pantalla de espera
      await storePage.waitForURL(/\/(store|register)\//, { timeout: 15_000 });

      const onboarding = new StoreOnboardingPage(storePage);
      // Si ya tiene el formulario, lo completa; si ya está en espera, el test termina aquí
      const isOnboarding = (await onboarding.businessNameInput.count()) > 0;
      if (isOnboarding) {
        // Paso 1: datos fiscales
        await onboarding.businessNameInput.fill(uniqueName);
        await onboarding.cuitInput.fill(ONBOARDING_DATA.step1.cuit);
        await onboarding.selectKind(ONBOARDING_DATA.step1.kind);
        await onboarding.nextButton.click();

        // Paso 2: zona
        await expect(onboarding.neighborhoodInput).toBeVisible({ timeout: 5_000 });
        await onboarding.neighborhoodInput.fill(ONBOARDING_DATA.step2.neighborhood);
        await onboarding.coverageNotesInput.fill(ONBOARDING_DATA.step2.coverageNotes);
        await onboarding.nextButton.click();

        // Paso 3: horarios
        await expect(onboarding.openTimeInput).toBeVisible({ timeout: 5_000 });
        for (const day of ONBOARDING_DATA.step3.days) {
          await onboarding.dayButton(day).click();
        }
        await onboarding.openTimeInput.fill(ONBOARDING_DATA.step3.openTime);
        await onboarding.closeTimeInput.fill(ONBOARDING_DATA.step3.closeTime);
        await onboarding.submitButton.click();

        await expect(onboarding.pendingApprovalMessage).toBeVisible({ timeout: 15_000 });
      } else {
        // La tienda ya completó el onboarding en una corrida anterior — OK
        await expect(onboarding.pendingApprovalMessage).toBeVisible({ timeout: 8_000 });
      }

      // ── Paso 2: Admin aprueba la tienda ───────────────────────────────────
      await adminPage.goto("/login");
      await adminPage.getByLabel(/correo electrónico/i).fill(E2E_USERS.admin.email);
      await adminPage.getByLabel(/contraseña/i).fill(E2E_USERS.admin.password);
      await adminPage.getByRole("button", { name: /iniciar sesión|ingresar/i }).click();
      await adminPage.waitForURL("**/admin/**", { timeout: 15_000 });

      const adminStores = new AdminStoresPage(adminPage);
      await adminStores.goto();
      await adminStores.pendingTab.click();

      // Si el nombre único está en la lista, usarlo; si no, usar el nombre del seed pending
      const nameToApprove = isOnboarding ? uniqueName : "Empanadas La Porteña";
      const row = adminStores.storeRow(nameToApprove);
      await expect(row).toBeVisible({ timeout: 10_000 });
      await adminStores.viewStoreButton(nameToApprove).click();
      await adminStores.approveButton.click();
      await expect(adminStores.successToast).toBeVisible({ timeout: 10_000 });

      // ── Paso 3: Tienda aprobada accede a su dashboard operativo ───────────
      await storePage.reload();
      const dashboard = new StoreDashboardPage(storePage);
      await storePage.waitForURL("**/store/**", { timeout: 15_000 });
      await dashboard.goto();
      await expect(dashboard.availabilityToggle).toBeVisible({ timeout: 10_000 });
    } finally {
      await storeContext.close();
      await adminContext.close();
    }
  });
});
