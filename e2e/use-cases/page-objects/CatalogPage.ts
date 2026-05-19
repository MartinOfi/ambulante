import type { Page } from "@playwright/test";

export class CatalogPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/store/catalog", { waitUntil: "domcontentloaded" });
  }

  async gotoNewProduct() {
    await this.page.goto("/store/catalog/new", { waitUntil: "domcontentloaded" });
    // Full-page load triggers SSR + React hydration. Controlled inputs are reset
    // to their defaultValues during hydration, overwriting any fills done before
    // React attaches its event listeners. Waiting for the submit button to lose
    // its [disabled] attribute confirms hydration is done AND storeQuery resolved.
    await this.page
      .locator('button[type="submit"]:not([disabled])')
      .first()
      .waitFor({ timeout: 10_000 });
  }

  async gotoEditProduct(productId: string) {
    await this.page.goto(`/store/catalog/${productId}/edit`, { waitUntil: "domcontentloaded" });
  }

  async waitForEditPage() {
    await this.page.waitForURL("**/catalog/**/edit**", { timeout: 10_000 });
    await this.page
      .locator('button[type="submit"]:not([disabled])')
      .first()
      .waitFor({ timeout: 10_000 });
  }

  get addProductButton() {
    return this.page.getByRole("button", { name: /agregar producto|nuevo producto/i });
  }

  productCard(productName: string) {
    return this.page
      .getByRole("article")
      .filter({ has: this.page.getByRole("heading", { name: productName, exact: true }) })
      .first();
  }

  editProductButton(productName: string) {
    return this.productCard(productName).getByRole("button", { name: /editar/i });
  }

  deleteProductButton(productName: string) {
    return this.productCard(productName).getByRole("button", { name: /eliminar/i });
  }

  // ── Formulario ────────────────────────────────────────────────────────────

  get nameInput() {
    return this.page.getByRole("textbox", { name: /^nombre/i });
  }

  get descriptionInput() {
    return this.page.getByRole("textbox", { name: /descripción/i });
  }

  get priceInput() {
    return this.page.getByRole("spinbutton", { name: /precio/i });
  }

  get imageUpload() {
    return this.page.getByTestId("product-image-upload");
  }

  get saveProductButton() {
    return this.page.getByRole("button", { name: /guardar producto|crear producto/i });
  }

  get deleteConfirmButton() {
    return this.page.getByRole("button", { name: /confirmar.*eliminaci[oó]n|sí.*eliminaci[oó]n/i });
  }

  // ── Errores ───────────────────────────────────────────────────────────────

  get nameRequiredError() {
    return this.page.getByText(/nombre.*obligatorio/i);
  }

  get priceInvalidError() {
    return this.page.getByText(/precio.*negativo|precio.*inválido/i);
  }

  // ── Feedback ──────────────────────────────────────────────────────────────

  get successToast() {
    return this.page.getByText(/producto.*creado|producto.*guardado|producto.*eliminado/i);
  }

  get emptyState() {
    return this.page.getByText(/no hay productos|catálogo vacío/i);
  }
}
