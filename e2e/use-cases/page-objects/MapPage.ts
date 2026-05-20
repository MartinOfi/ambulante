import type { Page } from "@playwright/test";

export class MapPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/map", { waitUntil: "domcontentloaded" });
  }

  get mapCanvas() {
    return this.page.getByRole("region", { name: /mapa/i });
  }

  get bottomSheet() {
    return this.page.getByRole("region", { name: /tiendas cercanas|lista de tiendas/i });
  }

  get expandBottomSheetButton() {
    return this.page.getByRole("button", { name: /expandir|colapsar.*hoja/i });
  }

  async expandBottomSheet() {
    await this.expandBottomSheetButton.click({ timeout: 15_000 });
  }

  storeCard(storeName: string) {
    return this.page.getByRole("button", { name: new RegExp(storeName, "i") });
  }

  async openStoreDetail(storeName: string) {
    await this.page.waitForLoadState("domcontentloaded");
    await this.storeCard(storeName).click();
  }

  get storeDetailDialog() {
    return this.page.getByRole("dialog");
  }

  get closeStoreDetailButton() {
    return this.page.getByRole("button", { name: /cerrar detalle/i });
  }

  async closeStoreDetail() {
    await this.closeStoreDetailButton.click();
  }

  addToCartButton(productName: string) {
    return this.page.getByRole("button", { name: new RegExp(`Agregar ${productName}`, "i") });
  }

  get recenterButton() {
    return this.page.getByRole("button", { name: /recentrar|mi ubicación/i });
  }

  get staleLocationBanner() {
    return this.page.getByText(/ubicación desactualizada/i);
  }
}
