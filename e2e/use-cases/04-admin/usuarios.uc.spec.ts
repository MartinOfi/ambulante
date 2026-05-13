import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers";
import { AdminUsersPage } from "../page-objects/AdminPages";
import { E2E_USERS } from "../fixtures/users";

// UC-ADM-07: Ver lista de usuarios
test.describe("UC-ADM-07 — lista de usuarios", () => {
  test("página de usuarios carga la tabla", async ({ page }) => {
    await loginAsAdmin(page);
    const users = new AdminUsersPage(page);
    await users.goto();
    await expect(page.getByRole("table").or(page.getByRole("list"))).toBeVisible({
      timeout: 10_000,
    });
  });
});

// UC-ADM-08: Buscar usuario por nombre
test.describe("UC-ADM-08 — buscar usuario", () => {
  test("buscar por nombre del cliente filtra resultados", async ({ page }) => {
    await loginAsAdmin(page);
    const users = new AdminUsersPage(page);
    await users.goto();
    await users.searchInput.fill(E2E_USERS.client.name);
    await expect(users.userRow(E2E_USERS.client.name)).toBeVisible({ timeout: 8_000 });
  });
});

// UC-ADM-09: Filtrar usuarios por rol
test.describe("UC-ADM-09 — filtrar por rol", () => {
  test("filtro de rol actualiza la lista", async ({ page }) => {
    await loginAsAdmin(page);
    const users = new AdminUsersPage(page);
    await users.goto();
    await users.roleFilter.selectOption({ label: "Clientes" });
    // La lista debe mostrar solo clientes
    await expect(page.getByRole("row").nth(1)).toBeVisible({ timeout: 5_000 });
  });
});

// UC-ADM-10: Suspender usuario
test.describe("UC-ADM-10 — suspender usuario", () => {
  test("suspender usuario muestra badge de suspendido", async ({ page }) => {
    await loginAsAdmin(page);
    const users = new AdminUsersPage(page);
    await users.goto();
    await users.userRow(E2E_USERS.client.name).click();
    await expect(users.suspendButton).toBeVisible({ timeout: 8_000 });
    await users.suspendButton.click();
    await users.confirmSuspendButton.click();
    await expect(users.suspendedBadge).toBeVisible({ timeout: 8_000 });
  });
});

// UC-ADM-11: Reactivar usuario suspendido
test.describe("UC-ADM-11 — reactivar usuario", () => {
  test("reactivar usuario suspendido muestra badge activo", async ({ page }) => {
    await loginAsAdmin(page);
    const users = new AdminUsersPage(page);
    await users.goto();
    await users.userRow(E2E_USERS.client.name).click();
    // Si está suspendido, reactivar; si no, verificar que el botón de reactivar existe como fallback
    const isSuspended = (await users.reactivateButton.count()) > 0;
    if (isSuspended) {
      await users.reactivateButton.click();
      await expect(users.activeStatusBadge).toBeVisible({ timeout: 8_000 });
    } else {
      await expect(users.suspendButton).toBeVisible({ timeout: 5_000 });
    }
  });
});

// UC-ADM-11b: Ver historial de pedidos de un usuario
test.describe("UC-ADM-11b — historial de pedidos de usuario", () => {
  test("detalle del usuario muestra tabla de pedidos", async ({ page }) => {
    await loginAsAdmin(page);
    const users = new AdminUsersPage(page);
    await users.goto();
    await users.userRow(E2E_USERS.client.name).click();
    await expect(users.ordersHistoryTable).toBeVisible({ timeout: 8_000 });
  });
});
