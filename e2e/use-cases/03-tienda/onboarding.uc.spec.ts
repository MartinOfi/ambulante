import { expect, test } from "@playwright/test";
import { StoreOnboardingPage } from "../page-objects/StoreOnboardingPage";
import { loginAsStorePending, loginAsStoreRejected } from "../helpers";
import { ONBOARDING_DATA, INVALID_CUIT } from "../fixtures/stores";

// UC-STO-01: Rellenar paso 1 del onboarding (datos fiscales)
test.describe("UC-STO-01 — onboarding paso 1: datos fiscales", () => {
  test("muestra formulario de datos fiscales", async ({ page }) => {
    const onboarding = new StoreOnboardingPage(page);
    await onboarding.goto();
    await expect(onboarding.businessNameInput).toBeVisible({ timeout: 8_000 });
    await expect(onboarding.cuitInput).toBeVisible();
  });

  test("CUIT inválido muestra error de validación", async ({ page }) => {
    const onboarding = new StoreOnboardingPage(page);
    await onboarding.goto();
    await onboarding.businessNameInput.fill(ONBOARDING_DATA.step1.businessName);
    await onboarding.cuitInput.fill(INVALID_CUIT);
    await onboarding.selectKind(ONBOARDING_DATA.step1.kind);
    await onboarding.nextButton.click();
    await expect(onboarding.cuitError).toBeVisible({ timeout: 3_000 });
  });

  test("paso 1 válido navega al paso 2", async ({ page }) => {
    const onboarding = new StoreOnboardingPage(page);
    await onboarding.goto();
    await onboarding.businessNameInput.fill(ONBOARDING_DATA.step1.businessName);
    await onboarding.cuitInput.fill(ONBOARDING_DATA.step1.cuit);
    await onboarding.selectKind(ONBOARDING_DATA.step1.kind);
    await onboarding.nextButton.click();
    await expect(onboarding.neighborhoodInput).toBeVisible({ timeout: 5_000 });
  });
});

// UC-STO-02: Rellenar paso 2 del onboarding (zona de cobertura)
test.describe("UC-STO-02 — onboarding paso 2: zona de cobertura", () => {
  async function goToStep2(page: Parameters<typeof loginAsStorePending>[0]) {
    const onboarding = new StoreOnboardingPage(page);
    await onboarding.goto();
    await onboarding.businessNameInput.fill(ONBOARDING_DATA.step1.businessName);
    await onboarding.cuitInput.fill(ONBOARDING_DATA.step1.cuit);
    await onboarding.selectKind(ONBOARDING_DATA.step1.kind);
    await onboarding.nextButton.click();
    await expect(onboarding.neighborhoodInput).toBeVisible({ timeout: 5_000 });
    return onboarding;
  }

  test("completar zona navega al paso 3", async ({ page }) => {
    const onboarding = await goToStep2(page);
    await onboarding.neighborhoodInput.fill(ONBOARDING_DATA.step2.neighborhood);
    await onboarding.coverageNotesInput.fill(ONBOARDING_DATA.step2.coverageNotes);
    await onboarding.nextButton.click();
    await expect(onboarding.openTimeInput).toBeVisible({ timeout: 5_000 });
  });

  test("botón Anterior vuelve al paso 1", async ({ page }) => {
    const onboarding = await goToStep2(page);
    await onboarding.backButton.click();
    await expect(onboarding.businessNameInput).toBeVisible({ timeout: 3_000 });
  });
});

// UC-STO-03: Rellenar paso 3 del onboarding (horarios) y enviar
test.describe("UC-STO-03 — onboarding paso 3: horarios y envío", () => {
  async function goToStep3(page: Parameters<typeof loginAsStorePending>[0]) {
    const onboarding = new StoreOnboardingPage(page);
    await onboarding.goto();
    await onboarding.businessNameInput.fill(ONBOARDING_DATA.step1.businessName);
    await onboarding.cuitInput.fill(ONBOARDING_DATA.step1.cuit);
    await onboarding.selectKind(ONBOARDING_DATA.step1.kind);
    await onboarding.nextButton.click();
    await expect(onboarding.neighborhoodInput).toBeVisible({ timeout: 5_000 });
    await onboarding.neighborhoodInput.fill(ONBOARDING_DATA.step2.neighborhood);
    await onboarding.coverageNotesInput.fill(ONBOARDING_DATA.step2.coverageNotes);
    await onboarding.nextButton.click();
    await expect(onboarding.openTimeInput).toBeVisible({ timeout: 5_000 });
    return onboarding;
  }

  test("cierre anterior a apertura muestra error", async ({ page }) => {
    const onboarding = await goToStep3(page);
    await onboarding.dayCheckbox(ONBOARDING_DATA.step3.days[0]).check();
    await onboarding.openTimeInput.fill("18:00");
    await onboarding.closeTimeInput.fill("10:00");
    await onboarding.submitButton.click();
    await expect(onboarding.closeBeforeOpenError).toBeVisible({ timeout: 3_000 });
  });

  test("envío exitoso muestra mensaje de solicitud pendiente", async ({ page }) => {
    const onboarding = await goToStep3(page);
    for (const day of ONBOARDING_DATA.step3.days) {
      await onboarding.dayCheckbox(day).check();
    }
    await onboarding.openTimeInput.fill(ONBOARDING_DATA.step3.openTime);
    await onboarding.closeTimeInput.fill(ONBOARDING_DATA.step3.closeTime);
    await onboarding.submitButton.click();
    await expect(onboarding.pendingApprovalMessage).toBeVisible({ timeout: 15_000 });
  });
});

// UC-STO-04: Tienda pendiente ve banner de espera
test.describe("UC-STO-04 — tienda pendiente ve estado pendiente", () => {
  test("tienda en espera ve mensaje de revisión pendiente", async ({ page }) => {
    await loginAsStorePending(page);
    const onboarding = new StoreOnboardingPage(page);
    await expect(onboarding.pendingApprovalMessage).toBeVisible({ timeout: 8_000 });
  });
});

// UC-STO-05: Tienda rechazada ve motivo de rechazo
test.describe("UC-STO-05 — tienda rechazada ve motivo", () => {
  test("tienda rechazada ve mensaje de rechazo con motivo", async ({ page }) => {
    await loginAsStoreRejected(page);
    const onboarding = new StoreOnboardingPage(page);
    await expect(onboarding.rejectedMessage).toBeVisible({ timeout: 8_000 });
    await expect(onboarding.rejectionReasonText).toBeVisible({ timeout: 5_000 });
  });
});

// UC-STO-06: Indicador de pasos del wizard
test.describe("UC-STO-06 — indicador de progreso del wizard", () => {
  test("indicador de pasos es visible durante el onboarding", async ({ page }) => {
    const onboarding = new StoreOnboardingPage(page);
    await onboarding.goto();
    await expect(onboarding.stepIndicator).toBeVisible({ timeout: 5_000 });
  });
});
