import type { Page, Locator } from "@playwright/test";

export class OrderTrackingPage {
  constructor(private readonly page: Page) {}

  async gotoOrder(orderId: string) {
    await this.page.goto(`/orders/${orderId}`);
  }

  statusStep(status: string): Locator {
    return this.page.getByTestId(`step-${status}`);
  }

  get currentStatusStep(): Locator {
    return this.page.locator("[data-current='true']");
  }

  get cancelButton(): Locator {
    return this.page.getByRole("button", { name: /cancelar pedido/i });
  }

  get confirmOnTheWayButton(): Locator {
    return this.page.getByRole("button", { name: /voy en camino|confirmar.*camino/i });
  }

  get cancelledMessage(): Locator {
    return this.page.getByText(/pedido cancelado/i);
  }

  get rejectedMessage(): Locator {
    return this.page.getByText(/pedido rechazado/i);
  }

  get finalizedMessage(): Locator {
    return this.page.getByText(/pedido finalizado/i);
  }

  get expiredMessage(): Locator {
    return this.page.getByText(/pedido expirado/i);
  }

  get storeLocationMap(): Locator {
    return this.page.getByRole("region", { name: /ubicación.*tienda/i });
  }

  get orderItemsList(): Locator {
    return this.page.getByRole("list", { name: /productos del pedido/i });
  }
}

export class OrderHistoryPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/orders");
  }

  orderCard(status: string): Locator {
    return this.page.locator(`[data-order-status='${status}']`);
  }

  async filterByStatus(status: string): Promise<void> {
    await this.page
      .getByRole("toolbar", { name: /filtrar por estado/i })
      .getByRole("button", { name: new RegExp(status, "i") })
      .click();
  }

  get emptyMessage(): Locator {
    return this.page.getByText(/no tenés pedidos/i);
  }
}
