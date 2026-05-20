import type { Page } from "@playwright/test";

export class CartDrawer {
  constructor(private readonly page: Page) {}

  get cartSummary() {
    return this.page.getByRole("region", { name: /resumen del carrito/i });
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
    return this.itemRow(productName).getByRole("button", { name: /aumentar|más|\+/i });
  }

  decreaseButton(productName: string) {
    return this.itemRow(productName).getByRole("button", { name: /disminuir|menos|-/i });
  }

  removeButton(productName: string) {
    return this.itemRow(productName).getByRole("button", { name: /eliminar|quitar/i });
  }

  get clearCartButton() {
    return this.page.getByRole("button", { name: /vaciar carrito/i });
  }

  get totalPrice() {
    return this.page.getByTestId("cart-total");
  }

  async submitOrder() {
    await this.cartSummary.waitFor({ state: "visible", timeout: 5_000 });
    await this.submitButton.click();
  }
}
