import type { Page, Locator } from "@playwright/test";

export class StoreOrderDetailPage {
  constructor(private readonly page: Page) {}

  async goto(orderId: string) {
    await this.page.goto(`/store/order/${orderId}`, { waitUntil: "domcontentloaded" });
  }

  get acceptButton(): Locator {
    return this.page.getByRole("button", { name: /aceptar/i });
  }

  get rejectButton(): Locator {
    return this.page.getByRole("button", { name: /rechazar/i });
  }

  get finalizeButton(): Locator {
    return this.page.getByRole("button", { name: /finalizar/i });
  }

  orderStatusBadge(status: string): Locator {
    return this.page.locator(`[data-order-status='${status}']`).first();
  }
}
