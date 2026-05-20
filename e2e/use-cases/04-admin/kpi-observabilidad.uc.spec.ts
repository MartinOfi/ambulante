import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers";
import { AdminDashboardPage, AdminOrdersPage } from "../page-objects/AdminPages";

// UC-ADM-01: Dashboard de KPIs
test.describe("UC-ADM-01 — dashboard de KPIs", () => {
  test("dashboard muestra los 4 KPIs principales", async ({ page }) => {
    await loginAsAdmin(page);
    const dashboard = new AdminDashboardPage(page);
    await dashboard.goto();
    await expect(dashboard.totalStoresKpi).toBeVisible({ timeout: 20_000 });
    await expect(dashboard.pendingStoresKpi).toBeVisible();
    await expect(dashboard.totalOrdersKpi).toBeVisible();
    await expect(dashboard.totalUsersKpi).toBeVisible();
  });

  test("sidebar de navegación admin es visible", async ({ page }) => {
    await loginAsAdmin(page);
    const dashboard = new AdminDashboardPage(page);
    await dashboard.goto();
    await expect(dashboard.sidebarNav).toBeVisible({ timeout: 8_000 });
  });
});

// UC-ADM-15: Auditoría de pedidos (audit log)
test.describe("UC-ADM-15 — audit log de pedidos", () => {
  test("página de pedidos admin es accesible", async ({ page }) => {
    await loginAsAdmin(page);
    const orders = new AdminOrdersPage(page);
    await orders.goto();
    await expect(page.getByRole("table").or(page.getByRole("list")).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});

// UC-ADM-16: Ver audit log de transiciones de un pedido
test.describe("UC-ADM-16 — audit log de transiciones de pedido", () => {
  test("pedido con historial muestra sección de audit log", async ({ page }) => {
    await loginAsAdmin(page);
    const orders = new AdminOrdersPage(page);
    await orders.goto();
    // Abrir el primer pedido disponible
    const firstRow = page.getByRole("row").nth(1);
    await expect(firstRow).toBeVisible({ timeout: 8_000 });
    await firstRow.click();
    await expect(orders.auditLogSection).toBeVisible({ timeout: 8_000 });
  });
});

// UC-ADM-17: Navegación entre secciones admin
test.describe("UC-ADM-17 — navegación entre secciones admin", () => {
  test("desde dashboard se puede navegar a tiendas, usuarios, moderación y pedidos", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    const dashboard = new AdminDashboardPage(page);
    await dashboard.goto();
    // Verificar links de la sidebar
    const sidebar = dashboard.sidebarNav;
    await expect(sidebar.getByRole("link", { name: /tiendas/i })).toBeVisible({ timeout: 5_000 });
    await expect(sidebar.getByRole("link", { name: /usuarios/i })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: /moderación|reportes/i })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: /pedidos/i })).toBeVisible();
  });
});
