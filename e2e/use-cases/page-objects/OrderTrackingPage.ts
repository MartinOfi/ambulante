import type { Page, Locator } from "@playwright/test";

export class OrderTrackingPage {
  constructor(private readonly page: Page) {}

  async gotoOrder(orderId: string) {
    await this.page.goto(`/orders/${orderId}`, { waitUntil: "domcontentloaded" });
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
    await this.page.goto("/orders", { waitUntil: "domcontentloaded" });
  }

  async waitForReady(): Promise<void> {
    // Toolbar only renders when isLoading === false; dev-mode compilation can add ~5s
    await this.page
      .getByRole("toolbar", { name: /filtrar por estado/i })
      .waitFor({ state: "visible", timeout: 20_000 });
    // After toolbar appears the fetch may still be in-flight (two-step auth emits two
    // clientIds in quick succession). Wait for any loading skeleton to disappear so we
    // don't resolve during the brief isLoading=false window between the two emits.
    await this.page
      .locator('[data-testid="orders-loading"]')
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => {});
  }

  /**
   * Returns the FIRST card matching a given status. The DB seed accumulates
   * cards across runs, so this selector can match many. Caller can re-scope if
   * a specific orderId is known.
   */
  orderCard(status: string): Locator {
    return this.page.locator(`[data-order-status='${status}']`).first();
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
