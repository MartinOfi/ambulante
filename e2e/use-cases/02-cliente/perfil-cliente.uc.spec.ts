import { expect, test } from "@playwright/test";
import { loginAsClient } from "../helpers";
import { E2E_USERS } from "../fixtures/users";

// UC-CLI-18: Ver y editar perfil del cliente
test.describe("UC-CLI-18 — perfil del cliente", () => {
  test("muestra el nombre del cliente en su perfil", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(new RegExp(E2E_USERS.client.name, "i")).first()).toBeVisible({
      timeout: 8_000,
    });
  });

  test("puede editar el nombre y guardarlo", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
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
// Usa fresh browser.newContext + login manual en lugar del storageState compartido
// (client.json) porque signOut revoca la sesión server-side. Si el test usara la
// sesión compartida, tests posteriores que carguen client.json (UC-STO-18, UC-FLOW-03)
// fallarían en bucle de redirección al middleware. La nueva sesión local es
// independiente de client.json y se descarta con context.close.
test.describe("UC-CLI-19 — cerrar sesión", () => {
  test.setTimeout(60_000);
  test("logout redirige a la página pública", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      await page.getByLabel(/correo electrónico/i).fill(E2E_USERS.client.email);
      await page.getByLabel(/contraseña/i).fill(E2E_USERS.client.password);
      await page.getByRole("button", { name: /iniciar sesión|ingresar/i }).click();

      // Supabase SSR escribe la sesión en cookies del context (no en localStorage).
      // Esperar a que la cookie auth esté antes de pedir /map: si el router.push del
      // container sale antes que la cookie, el middleware (getUser() server-side) no
      // ve sesión y rebota a /login, generando un loop que termina en timeout.
      await expect
        .poll(
          async () => {
            const cookies = await context.cookies();
            return cookies.some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
          },
          { timeout: 15_000, intervals: [200, 500, 1000] },
        )
        .toBe(true);

      await page.waitForURL("**/map**", { timeout: 30_000, waitUntil: "domcontentloaded" });

      await page.goto("/profile", { waitUntil: "domcontentloaded" });
      const logoutButton = page.getByRole("button", { name: /cerrar sesión|salir/i });
      await expect(logoutButton).toBeVisible({ timeout: 5_000 });
      await logoutButton.click();
      await page.waitForURL(/\/(login|$)/, { timeout: 10_000 });
      expect(page.url()).not.toContain("/map");
    } finally {
      await context.close();
    }
  });
});
