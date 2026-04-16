import type { Product } from "@/shared/schemas/product";

/**
 * Versión inmutable y branded de Product capturada al momento de crear un pedido.
 * Distingue en el type system un producto "vivo" de un snapshot histórico,
 * evitando que se pase un Product sin pasar por `snapshot()` primero.
 */
export type ProductSnapshot = Readonly<Product> & { readonly _brand: "ProductSnapshot" };

/**
 * Crea un snapshot inmutable del producto.
 * Retorna una copia congelada — el original no se modifica.
 */
export function snapshot(product: Product): ProductSnapshot {
  // Copiamos antes de congelar para no mutar el objeto original (§6.6).
  return Object.freeze({ ...product }) as ProductSnapshot;
}
