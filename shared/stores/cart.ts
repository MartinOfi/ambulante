import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { OrderItem } from "@/shared/schemas/order";
import type { Product } from "@/shared/schemas/product";

const CART_STORE_STORAGE_KEY = "ambulante-cart" as const;

export interface CartItem extends OrderItem {
  readonly storeId: string;
}

interface CartState {
  readonly activeStoreId: string | null;
  readonly items: readonly CartItem[];
}

interface CartActions {
  addItem: (product: Product, storeId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  totalItems: () => number;
}

type CartStore = CartState & CartActions;

const INITIAL_STATE: CartState = {
  activeStoreId: null,
  items: [],
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      addItem: (product: Product, storeId: string) => {
        set((state) => {
          const isDifferentStore = state.activeStoreId !== null && state.activeStoreId !== storeId;

          if (isDifferentStore) {
            return {
              ...state,
              activeStoreId: storeId,
              items: [
                {
                  productId: product.id,
                  productName: product.name,
                  productPriceArs: product.priceArs,
                  quantity: 1,
                  storeId,
                },
              ],
            };
          }

          const existing = state.items.find((item) => item.productId === product.id);

          if (existing !== undefined) {
            return {
              ...state,
              activeStoreId: storeId,
              items: state.items.map((item) =>
                item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
              ),
            };
          }

          return {
            ...state,
            activeStoreId: storeId,
            items: [
              ...state.items,
              {
                productId: product.id,
                productName: product.name,
                productPriceArs: product.priceArs,
                quantity: 1,
                storeId,
              },
            ],
          };
        });
      },

      removeItem: (productId: string) => {
        set((state) => ({
          ...state,
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },

      clearCart: () => {
        set(() => ({ ...INITIAL_STATE }));
      },

      totalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: CART_STORE_STORAGE_KEY,
      partialize: (state): CartState => ({
        activeStoreId: state.activeStoreId,
        items: state.items,
      }),
    },
  ),
);
