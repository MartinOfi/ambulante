import type { Page, Locator } from "@playwright/test";

// ── Admin Dashboard ───────────────────────────────────────────────────────────

export class AdminDashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/admin/dashboard", { waitUntil: "domcontentloaded" });
  }

  get totalStoresKpi(): Locator {
    return this.page.getByTestId("kpi-active-stores");
  }

  get pendingStoresKpi(): Locator {
    return this.page.getByTestId("kpi-expiration-rate");
  }

  get totalOrdersKpi(): Locator {
    return this.page.getByTestId("kpi-orders-per-day");
  }

  get totalUsersKpi(): Locator {
    return this.page.getByTestId("kpi-acceptance-rate");
  }

  get sidebarNav(): Locator {
    return this.page.getByRole("navigation", { name: /admin/i });
  }
}

// ── Admin Stores Validation ───────────────────────────────────────────────────

export class AdminStoresPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/admin/stores", { waitUntil: "domcontentloaded" });
  }

  async gotoStoreDetail(storeId: string) {
    await this.page.goto(`/admin/stores/${storeId}`, { waitUntil: "domcontentloaded" });
  }

  get pendingTab(): Locator {
    return this.page.getByRole("tab", { name: /pendientes/i });
  }

  get approvedTab(): Locator {
    return this.page.getByRole("tab", { name: /aprobadas/i });
  }

  get rejectedTab(): Locator {
    return this.page.getByRole("tab", { name: /rechazadas/i });
  }

  get searchInput(): Locator {
    return this.page
      .getByRole("searchbox", { name: /buscar tienda/i })
      .or(this.page.getByPlaceholder(/buscar/i));
  }

  storeRow(storeName: string): Locator {
    return this.page
      .getByRole("row")
      .or(this.page.getByRole("listitem"))
      .filter({ hasText: storeName });
  }

  viewStoreButton(storeName: string): Locator {
    return this.storeRow(storeName).getByRole("link", { name: /ver|detalle/i });
  }

  get approveButton(): Locator {
    return this.page.getByRole("button", { name: /aprobar tienda/i });
  }

  get rejectButton(): Locator {
    return this.page.getByRole("button", { name: /rechazar tienda/i });
  }

  get rejectionReasonInput(): Locator {
    return this.page.getByRole("textbox", { name: /motivo.*rechazo/i });
  }

  get confirmRejectionButton(): Locator {
    return this.page.getByRole("button", { name: /confirmar rechazo/i });
  }

  get rejectionReasonTooShortError(): Locator {
    return this.page.getByText(/mínimo.*10.*caracteres/i);
  }

  get successToast(): Locator {
    return this.page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /tienda.*aprobada|tienda.*rechazada/i });
  }
}

// ── Admin Users ───────────────────────────────────────────────────────────────

export class AdminUsersPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/admin/users", { waitUntil: "domcontentloaded" });
    await this.page
      .getByRole("heading", { name: /gestión de usuarios/i })
      .waitFor({ timeout: 15_000 });
  }

  async gotoUserDetail(userId: string) {
    await this.page.goto(`/admin/users/${userId}`, { waitUntil: "domcontentloaded" });
  }

  get searchInput(): Locator {
    return this.page.getByLabel(/buscar usuario/i);
  }

  get roleFilter(): Locator {
    return this.page.getByLabel(/filtrar por rol/i);
  }

  userRow(userName: string): Locator {
    return this.page.getByRole("row").filter({ hasText: userName });
  }

  get suspendButton(): Locator {
    return this.page.getByRole("button", { name: /^suspender$/i });
  }

  get suspendReasonInput(): Locator {
    return this.page.getByLabel(/motivo.*suspensión/i);
  }

  get confirmSuspendButton(): Locator {
    return this.page.getByRole("button", { name: /confirmar.*suspensión|sí.*suspender/i });
  }

  get reactivateButton(): Locator {
    return this.page.getByRole("button", { name: /^reactivar$/i });
  }

  get suspendedBadge(): Locator {
    return this.page.getByText(/suspendido/i);
  }

  get activeStatusBadge(): Locator {
    return this.page.getByText(/activo/i).first();
  }

  get ordersHistoryTable(): Locator {
    return this.page.getByRole("table", { name: /pedidos/i });
  }
}

// ── Admin Moderation ──────────────────────────────────────────────────────────

export class AdminModerationPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/admin/moderation", { waitUntil: "domcontentloaded" });
    await this.page.getByRole("main").first().waitFor({
      state: "visible",
      timeout: 15_000,
    });
  }

  get reportCard(): Locator {
    return this.page.getByRole("article").first();
  }

  get dismissButton(): Locator {
    return this.page.getByRole("button", { name: /desestimar|contenido ok/i }).first();
  }

  get removeContentButton(): Locator {
    return this.page.getByRole("button", { name: /eliminar contenido/i }).first();
  }

  get emptyQueueMessage(): Locator {
    return this.page.getByText(/no hay reportes pendientes/i);
  }

  get successToast(): Locator {
    return this.page.getByText(/reporte.*procesado|contenido.*eliminado/i);
  }
}

// ── Admin Orders / Audit Log ──────────────────────────────────────────────────

export class AdminOrdersPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/admin/orders", { waitUntil: "domcontentloaded" });
  }

  orderRow(orderId: string): Locator {
    return this.page.getByRole("row").filter({ hasText: orderId });
  }

  get auditLogSection(): Locator {
    return this.page.getByRole("region", { name: /historial.*transiciones|audit log/i });
  }

  transitionEntry(event: string): Locator {
    return this.auditLogSection.getByText(new RegExp(event, "i"));
  }
}
