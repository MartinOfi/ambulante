import type { Page, Locator } from "@playwright/test";

export class StoreOrdersPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/store/orders", { waitUntil: "domcontentloaded" });
    // Full-page load triggers SSR + React hydration. useStoreOrdersQuery is
    // gated on storeId (from useCurrentStoreQuery), so the inbox only renders
    // after both queries resolve. Waiting for it confirms hydration is done
    // and the initial orders fetch completed — safe to assert firstOrderCard.
    await this.incomingOrdersSection.waitFor({ timeout: 10_000 }).catch(() => {});
  }

  /** The <section> wrapping the inbox — only rendered after storeQuery + orders fetch resolve */
  get incomingOrdersSection(): Locator {
    return this.page.getByRole("region", { name: /bandeja de pedidos entrantes/i });
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
    return this.page
      .getByRole("region", { name: /bandeja de pedidos entrantes/i })
      .getByRole("listitem")
      .first()
      .getByRole("link");
  }

  /** Navigate to the first order's detail page */
  async clickFirstOrder() {
    await this.firstOrderCard.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  orderStatusBadge(status: string): Locator {
    return this.page.locator(`[data-order-status='${status}']`).first();
  }
}
