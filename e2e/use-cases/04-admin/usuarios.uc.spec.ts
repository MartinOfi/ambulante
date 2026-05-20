import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { loginAsAdmin } from "../helpers";
import { AdminUsersPage } from "../page-objects/AdminPages";
import { E2E_USERS } from "../fixtures/users";

// UC-ADM-10 and UC-ADM-11 share the same E2E_USERS.client fixture whose suspended
// state is mutated across cases (active → suspended → active). Serial mode prevents
// race conditions when fullyParallel is enabled at the project level.
test.describe.configure({ mode: "serial" });

// UC-ADM-07: Ver lista de usuarios
test.describe("UC-ADM-07 — lista de usuarios", () => {
  test("página de usuarios carga la tabla", async ({ page }) => {
    await loginAsAdmin(page);
    const users = new AdminUsersPage(page);
    await users.goto();
    await expect(page.getByRole("table").or(page.getByRole("list")).first()).toBeVisible({
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
  test.beforeEach(async () => {
    const supabase = createClient(
      process.env.PLAYWRIGHT_SUPABASE_URL ??
        process.env.NEXT_PUBLIC_SUPABASE_URL ??
        "http://127.0.0.1:54321",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    await supabase.from("users").update({ suspended: false }).eq("email", E2E_USERS.client.email);
  });

  test("suspender usuario muestra badge de suspendido", async ({ page }) => {
    await loginAsAdmin(page);
    const users = new AdminUsersPage(page);
    await users.goto();
    await users.userRow(E2E_USERS.client.name).click();
    await expect(users.suspendButton).toBeVisible({ timeout: 8_000 });
    await users.suspendButton.click();
    await users.suspendReasonInput.fill("Comportamiento abusivo");
    await users.confirmSuspendButton.click();
    await expect(users.suspendedBadge).toBeVisible({ timeout: 8_000 });
  });
});

// UC-ADM-11: Reactivar usuario suspendido
test.describe("UC-ADM-11 — reactivar usuario", () => {
  test.beforeEach(async () => {
    const supabase = createClient(
      process.env.PLAYWRIGHT_SUPABASE_URL ??
        process.env.NEXT_PUBLIC_SUPABASE_URL ??
        "http://127.0.0.1:54321",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    await supabase.from("users").update({ suspended: true }).eq("email", E2E_USERS.client.email);
  });

  test("reactivar usuario suspendido muestra badge activo", async ({ page }) => {
    await loginAsAdmin(page);
    const users = new AdminUsersPage(page);
    await users.goto();
    await users.userRow(E2E_USERS.client.name).click();
    await expect(users.reactivateButton).toBeVisible({ timeout: 8_000 });
    await users.reactivateButton.click();
    await expect(users.activeStatusBadge).toBeVisible({ timeout: 8_000 });
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
