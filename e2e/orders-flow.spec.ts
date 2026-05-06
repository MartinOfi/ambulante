import { expect, test } from "@playwright/test";
import { loginAsClient } from "./helpers";

const STORE_NAME = "El Choripán de Pedro";
const PRODUCT_NAME = "Choripán simple";
const STORE_GEO = { latitude: -34.5779, longitude: -58.4328 };

test.describe("orders flow — client golden path", () => {
  test.use({
    permissions: ["geolocation"],
    geolocation: STORE_GEO,
  });

  test("cart → submit → ENVIADO → cancel → CANCELADO → history", async ({ page }) => {
    await loginAsClient(page);

    // NearbyBottomSheet starts in HALF snap; expand to FULL so store cards are in the DOM viewport
    await page
      .getByRole("button", { name: /expandir o colapsar hoja/i })
      .click({ timeout: 15_000 });

    await expect(page.getByRole("button", { name: new RegExp(STORE_NAME, "i") })).toBeVisible({
      timeout: 8_000,
    });

    await page.getByRole("button", { name: new RegExp(STORE_NAME, "i") }).click();
    await expect(page.getByRole("dialog", { name: new RegExp(STORE_NAME, "i") })).toBeVisible({
      timeout: 8_000,
    });

    await page.getByRole("button", { name: new RegExp(`Agregar ${PRODUCT_NAME}`, "i") }).click();

    await page.getByRole("button", { name: /cerrar detalle/i }).click();

    await expect(page.getByRole("region", { name: /resumen del carrito/i })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByRole("button", { name: /enviar pedido/i }).click();

    await page.waitForURL("**/orders/**", { timeout: 20_000 });
    expect(new URL(page.url()).pathname).toMatch(/^\/orders\/[^/]+$/);

    const enviadoStep = page.getByTestId("step-ENVIADO");
    await expect(enviadoStep).toBeVisible();
    await expect(enviadoStep).toHaveAttribute("data-current", "true");

    await page.getByRole("button", { name: /cancelar pedido/i }).click();
    await expect(page.getByText("Pedido cancelado")).toBeVisible({ timeout: 15_000 });

    await page.goto("/orders");
    await expect(page.locator("[data-order-status='CANCELADO']")).toBeVisible({ timeout: 10_000 });
  });
});
