import type { Page } from "@playwright/test";

export class CartDrawer {
  constructor(private readonly page: Page) {}

  get cartSummary() {
    return this.page.getByRole("region", { name: /resumen del carrito/i });
  }

  get openCartButton() {
    return this.cartSummary.getByRole("button", { name: /ver pedido/i });
  }

  get submitButton() {
    return this.page.getByRole("button", { name: /enviar pedido/i });
  }

  get emptyMessage() {
    return this.page.getByText(/carrito vacío|no hay productos/i);
  }

  itemRow(productName: string) {
    return this.page.getByRole("listitem").filter({ hasText: productName });
  }

  increaseButton(productName: string) {
    return this.itemRow(productName).getByRole("button", { name: /aumentar/i });
  }

  decreaseButton(productName: string) {
    return this.itemRow(productName).getByRole("button", { name: /disminuir/i });
  }

  removeButton(productName: string) {
    return this.itemRow(productName).getByRole("button", { name: /eliminar/i });
  }

  get clearCartButton() {
    return this.page.getByRole("button", { name: /vaciar (carrito|pedido)/i });
  }

  get totalPrice() {
    return this.page.getByTestId("cart-total");
  }

  async open() {
    if (await this.submitButton.isVisible().catch(() => false)) return;
    await this.openCartButton.click();
    await this.submitButton.waitFor({ state: "visible" });
  }

  async submitOrder() {
    await this.cartSummary.waitFor({ state: "visible", timeout: 5_000 });
    await this.open();
    await this.submitButton.click();
  }
}
