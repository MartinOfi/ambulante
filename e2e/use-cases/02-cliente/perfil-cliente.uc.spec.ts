import { expect, test } from "@playwright/test";
import { loginAsClient } from "../helpers";
import { E2E_USERS } from "../fixtures/users";

// UC-CLI-18: Ver y editar perfil del cliente
test.describe("UC-CLI-18 — perfil del cliente", () => {
  test("muestra el nombre del cliente en su perfil", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/profile");
    await expect(page.getByText(new RegExp(E2E_USERS.client.name, "i")).first()).toBeVisible({
      timeout: 8_000,
    });
  });

  test("puede editar el nombre y guardarlo", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/profile");
    const editButton = page.getByRole("button", { name: /editar.*perfil|editar/i });
    await expect(editButton).toBeVisible({ timeout: 5_000 });
    await editButton.click();
    const nameInput = page.getByRole("textbox", { name: /nombre/i });
    await nameInput.fill("Juan Editado");
    await page.getByRole("button", { name: /guardar/i }).click();
    await expect(page.getByText(/guardado|actualizado/i)).toBeVisible({ timeout: 5_000 });
  });
});

// UC-CLI-19: Cerrar sesión
test.describe("UC-CLI-19 — cerrar sesión", () => {
  test("logout redirige a la página pública", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/profile");
    const logoutButton = page.getByRole("button", { name: /cerrar sesión|salir/i });
    await expect(logoutButton).toBeVisible({ timeout: 5_000 });
    await logoutButton.click();
    await page.waitForURL(/\/(login|$)/, { timeout: 10_000 });
    expect(page.url()).not.toContain("/map");
  });
});
