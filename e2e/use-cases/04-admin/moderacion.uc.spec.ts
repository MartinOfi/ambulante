import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers";
import { AdminModerationPage } from "../page-objects/AdminPages";

// UC-ADM-12: Ver cola de moderación
test.describe("UC-ADM-12 — cola de moderación", () => {
  test("página de moderación carga correctamente", async ({ page }) => {
    await loginAsAdmin(page);
    const moderation = new AdminModerationPage(page);
    await moderation.goto();
    await expect(moderation.reportCard.or(moderation.emptyQueueMessage)).toBeVisible({
      timeout: 10_000,
    });
  });
});

// UC-ADM-13: Desestimar reporte
test.describe("UC-ADM-13 — desestimar reporte", () => {
  test("desestimar reporte muestra toast de confirmación", async ({ page }) => {
    await loginAsAdmin(page);
    const moderation = new AdminModerationPage(page);
    await moderation.goto();
    const hasReports = (await moderation.reportCard.count()) > 0;
    if (!hasReports) {
      await expect(moderation.emptyQueueMessage).toBeVisible({ timeout: 5_000 });
      return;
    }
    await moderation.dismissButton.click();
    await expect(moderation.successToast).toBeVisible({ timeout: 8_000 });
  });
});

// UC-ADM-14: Eliminar contenido reportado
test.describe("UC-ADM-14 — eliminar contenido reportado", () => {
  test("eliminar contenido muestra toast de confirmación", async ({ page }) => {
    await loginAsAdmin(page);
    const moderation = new AdminModerationPage(page);
    await moderation.goto();
    const hasReports = (await moderation.reportCard.count()) > 0;
    if (!hasReports) {
      await expect(moderation.emptyQueueMessage).toBeVisible({ timeout: 5_000 });
      return;
    }
    await moderation.removeContentButton.click();
    await expect(moderation.successToast).toBeVisible({ timeout: 8_000 });
  });

  test("cola vacía tras procesar todos los reportes", async ({ page }) => {
    await loginAsAdmin(page);
    const moderation = new AdminModerationPage(page);
    await moderation.goto();
    // Si ya no hay reportes debe mostrar el mensaje de cola vacía
    while ((await moderation.reportCard.count()) > 0) {
      await moderation.dismissButton.click();
      await moderation.successToast.waitFor({ timeout: 5_000 });
    }
    await expect(moderation.emptyQueueMessage).toBeVisible({ timeout: 5_000 });
  });
});
