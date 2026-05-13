import type { Page, Locator } from "@playwright/test";

export class StoreOrdersPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/store/orders");
    await this.page.waitForLoadState("networkidle");
  }

  get incomingOrdersList(): Locator {
    return this.page.getByRole("list", { name: /pedidos entrantes|pedidos nuevos/i });
  }

  get emptyMessage(): Locator {
    return this.page.getByText(/no hay pedidos/i);
  }

  orderCard(orderId: string): Locator {
    return this.page
      .getByTestId(`order-card-${orderId}`)
      .or(this.page.getByRole("article").filter({ hasText: orderId }));
  }

  /** Botón de aceptar en el primer pedido visible */
  get firstAcceptButton(): Locator {
    return this.page.getByRole("button", { name: /aceptar/i }).first();
  }

  /** Botón de rechazar en el primer pedido visible */
  get firstRejectButton(): Locator {
    return this.page.getByRole("button", { name: /rechazar/i }).first();
  }

  /** Botón de finalizar en el primer pedido visible */
  get firstFinalizeButton(): Locator {
    return this.page.getByRole("button", { name: /finalizar/i }).first();
  }

  /** Botón de cancelar en el primer pedido visible */
  get firstCancelButton(): Locator {
    return this.page.getByRole("button", { name: /cancelar/i }).first();
  }

  acceptButton(orderCard: Locator): Locator {
    return orderCard.getByRole("button", { name: /aceptar/i });
  }

  rejectButton(orderCard: Locator): Locator {
    return orderCard.getByRole("button", { name: /rechazar/i });
  }

  finalizeButton(orderCard: Locator): Locator {
    return orderCard.getByRole("button", { name: /finalizar/i });
  }

  orderStatusBadge(status: string): Locator {
    return this.page.locator(`[data-order-status='${status}']`).first();
  }
}
