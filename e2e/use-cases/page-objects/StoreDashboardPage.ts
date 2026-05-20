import type { Page } from "@playwright/test";

export class StoreDashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/store/dashboard", { waitUntil: "domcontentloaded" });
  }

  private get statusSection() {
    return this.page.getByRole("region", { name: /estado/i });
  }

  get availabilityToggle() {
    return this.statusSection.getByRole("switch");
  }

  get availabilityLabel() {
    return this.statusSection.getByTestId("availability-status");
  }

  get notificationOptInButton() {
    return this.page.getByRole("button", { name: /activar notificaciones|habilitar.*push/i });
  }

  get notificationOptInBanner() {
    return this.page.getByTestId("notification-opt-in");
  }

  get incomingOrdersBadge() {
    return this.page.getByTestId("incoming-orders-badge");
  }

  get viewOrdersLink() {
    return this.page.getByRole("link", { name: /ver pedidos/i });
  }

  get viewCatalogLink() {
    return this.page.getByRole("link", { name: /ver catálogo|gestionar productos/i });
  }
}

export class StoreProfilePage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/store/profile", { waitUntil: "domcontentloaded" });
  }

  get storeNameDisplay() {
    return this.page.getByTestId("store-name");
  }

  get editProfileButton() {
    return this.page.getByRole("button", { name: /editar.*perfil/i });
  }

  get taglineInput() {
    return this.page.getByRole("textbox", { name: /descripción corta|tagline/i });
  }

  get descriptionInput() {
    return this.page.getByRole("textbox", { name: /descripción/i });
  }

  get saveButton() {
    return this.page.getByRole("button", { name: /guardar cambios/i });
  }

  get successToast() {
    return this.page.getByText(/perfil.*actualizado|cambios.*guardados/i);
  }
}

export class StoreAnalyticsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/store/analytics", { waitUntil: "domcontentloaded" });
  }

  get totalOrdersKpi() {
    return this.page.getByTestId("kpi-total-orders");
  }

  get totalRevenueKpi() {
    return this.page.getByTestId("kpi-total-revenue");
  }

  get ordersChart() {
    return this.page
      .getByRole("img", { name: /gráfico.*pedidos/i })
      .or(this.page.getByTestId("orders-chart"));
  }
}
