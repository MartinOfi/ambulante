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

  /** First order card link in the inbox list */
  get firstOrderCard(): Locator {
    return this.page.getByRole("listitem").first().getByRole("link");
  }

  /** Navigate to the first order's detail page */
  async clickFirstOrder() {
    await this.firstOrderCard.click();
    await this.page.waitForLoadState("networkidle");
  }

  orderStatusBadge(status: string): Locator {
    return this.page.locator(`[data-order-status='${status}']`).first();
  }
}
