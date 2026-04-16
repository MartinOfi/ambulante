import { describe, expect, it } from "vitest";

import { snapshot } from "@/shared/domain/product-snapshot";
import type { ProductSnapshot } from "@/shared/domain/product-snapshot";
import type { Product } from "@/shared/schemas/product";

const BASE_PRODUCT: Product = {
  id: "prod-001",
  storeId: "store-001",
  name: "Empanada de carne",
  description: "Rellena con carne picada y cebolla",
  priceArs: 500,
  photoUrl: "https://example.com/empanada.jpg",
  isAvailable: true,
};

describe("snapshot()", () => {
  it("retorna un objeto con los mismos valores del producto original", () => {
    const result = snapshot(BASE_PRODUCT);

    expect(result.id).toBe(BASE_PRODUCT.id);
    expect(result.storeId).toBe(BASE_PRODUCT.storeId);
    expect(result.name).toBe(BASE_PRODUCT.name);
    expect(result.description).toBe(BASE_PRODUCT.description);
    expect(result.priceArs).toBe(BASE_PRODUCT.priceArs);
    expect(result.photoUrl).toBe(BASE_PRODUCT.photoUrl);
    expect(result.isAvailable).toBe(BASE_PRODUCT.isAvailable);
  });

  it("retorna un objeto congelado (inmutable en runtime)", () => {
    const result = snapshot(BASE_PRODUCT);

    expect(Object.isFrozen(result)).toBe(true);
  });

  it("mutar una propiedad del snapshot no tiene efecto", () => {
    const result = snapshot(BASE_PRODUCT);

    // En strict mode lanzaría TypeError; fuera de strict simplemente no tiene efecto.
    // Verificamos que el valor no cambia.
    try {
      (result as { priceArs: number }).priceArs = 9999;
    } catch {
      // TypeError esperado en strict mode
    }

    expect(result.priceArs).toBe(BASE_PRODUCT.priceArs);
  });

  it("retorna una copia — no la misma referencia que el producto original", () => {
    const result = snapshot(BASE_PRODUCT);

    expect(result).not.toBe(BASE_PRODUCT);
  });

  it("dos snapshots del mismo producto son objetos distintos entre sí", () => {
    const first = snapshot(BASE_PRODUCT);
    const second = snapshot(BASE_PRODUCT);

    expect(first).not.toBe(second);
  });

  it("funciona con producto sin campos opcionales", () => {
    const minimal: Product = {
      id: "prod-002",
      storeId: "store-002",
      name: "Choripán",
      priceArs: 1200,
      isAvailable: false,
    };

    const result = snapshot(minimal);

    expect(result.id).toBe("prod-002");
    expect(result.description).toBeUndefined();
    expect(result.photoUrl).toBeUndefined();
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("el tipo ProductSnapshot es assignable a Readonly<Product>", () => {
    const result: ProductSnapshot = snapshot(BASE_PRODUCT);
    // Verificación estática: si compila, el tipo es correcto.
    expect(result).toBeDefined();
  });
});
