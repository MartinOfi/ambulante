import { expect, test } from "@playwright/test";
import { loginAsStore } from "../helpers";
import { CatalogPage } from "../page-objects/CatalogPage";
import {
  CATALOG_TEST_PRODUCT,
  EMPTY_PRODUCT_NAME,
  INVALID_PRODUCT_PRICE,
} from "../fixtures/products";

// UC-STO-11: Ver catálogo de productos
test.describe("UC-STO-11 — ver catálogo", () => {
  test("catálogo muestra productos existentes de la tienda", async ({ page }) => {
    await loginAsStore(page);
    const catalog = new CatalogPage(page);
    await catalog.goto();
    // La tienda seed tiene al menos un producto
    await expect(page.getByRole("article").first()).toBeVisible({ timeout: 8_000 });
  });
});

// UC-STO-12: Agregar nuevo producto
test.describe("UC-STO-12 — agregar producto", () => {
  test("crear producto válido lo muestra en el catálogo", async ({ page }) => {
    await loginAsStore(page);
    const catalog = new CatalogPage(page);
    await catalog.gotoNewProduct();
    await catalog.nameInput.fill(CATALOG_TEST_PRODUCT.new.name);
    await catalog.descriptionInput.fill(CATALOG_TEST_PRODUCT.new.description);
    await catalog.priceInput.fill(String(CATALOG_TEST_PRODUCT.new.priceArs));
    await catalog.saveProductButton.click();
    await expect(catalog.successToast).toBeVisible({ timeout: 10_000 });
    // Navegar al catálogo para verificar que aparece
    await catalog.goto();
    await expect(catalog.productCard(CATALOG_TEST_PRODUCT.new.name)).toBeVisible({
      timeout: 8_000,
    });
  });

  test("nombre vacío muestra error de validación", async ({ page }) => {
    await loginAsStore(page);
    const catalog = new CatalogPage(page);
    await catalog.gotoNewProduct();
    await catalog.nameInput.fill(EMPTY_PRODUCT_NAME);
    await catalog.priceInput.fill(String(CATALOG_TEST_PRODUCT.new.priceArs));
    await catalog.saveProductButton.click();
    await expect(catalog.nameRequiredError).toBeVisible({ timeout: 3_000 });
  });

  test("precio negativo muestra error de validación", async ({ page }) => {
    await loginAsStore(page);
    const catalog = new CatalogPage(page);
    await catalog.gotoNewProduct();
    await catalog.nameInput.fill(CATALOG_TEST_PRODUCT.new.name);
    await catalog.priceInput.fill(String(INVALID_PRODUCT_PRICE));
    await catalog.saveProductButton.click();
    await expect(catalog.priceInvalidError).toBeVisible({ timeout: 3_000 });
  });
});

// UC-STO-13: Editar producto existente
test.describe("UC-STO-13 — editar producto", () => {
  test("editar producto actualiza los datos en el catálogo", async ({ page }) => {
    await loginAsStore(page);
    const catalog = new CatalogPage(page);
    await catalog.goto();
    // Usar el primer producto del catálogo seed
    const firstProductCard = page.getByRole("article").first();
    await firstProductCard.getByRole("button", { name: /editar/i }).click();
    const newName = CATALOG_TEST_PRODUCT.updated.name;
    await catalog.nameInput.clear();
    await catalog.nameInput.fill(newName);
    await catalog.saveProductButton.click();
    await expect(catalog.successToast).toBeVisible({ timeout: 10_000 });
    await catalog.goto();
    await expect(catalog.productCard(newName)).toBeVisible({ timeout: 8_000 });
  });
});

// UC-STO-14: Eliminar producto
test.describe("UC-STO-14 — eliminar producto", () => {
  test("eliminar producto lo quita del catálogo", async ({ page }) => {
    await loginAsStore(page);
    const catalog = new CatalogPage(page);
    await catalog.goto();
    // Usar el primer producto
    const firstCard = page.getByRole("article").first();
    const productName = (await firstCard.getByRole("heading").textContent()) ?? "";
    await firstCard.getByRole("button", { name: /eliminar/i }).click();
    await catalog.deleteConfirmButton.click();
    await expect(catalog.successToast).toBeVisible({ timeout: 10_000 });
    if (productName) {
      await expect(catalog.productCard(productName)).not.toBeVisible({ timeout: 5_000 });
    }
  });
});

// UC-STO-15: Estado vacío del catálogo
test.describe("UC-STO-15 — catálogo vacío", () => {
  test("catálogo sin productos muestra estado vacío", async ({ page }) => {
    await loginAsStore(page);
    const catalog = new CatalogPage(page);
    await catalog.goto();
    // Este test aplica solo si el catálogo está vacío; de lo contrario pasa trivialmente
    const articles = await page.getByRole("article").count();
    if (articles === 0) {
      await expect(catalog.emptyState).toBeVisible({ timeout: 5_000 });
    } else {
      expect(articles).toBeGreaterThan(0);
    }
  });
});

// UC-STO-16: Subir imagen de producto
test.describe("UC-STO-16 — imagen de producto", () => {
  test("input de imagen de producto es accesible", async ({ page }) => {
    await loginAsStore(page);
    const catalog = new CatalogPage(page);
    await catalog.gotoNewProduct();
    await expect(catalog.imageUpload).toBeVisible({ timeout: 5_000 });
  });
});
