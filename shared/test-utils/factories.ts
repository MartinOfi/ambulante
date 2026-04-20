import { ORDER_STATUS } from "@/shared/constants/order";
import { STORE_KIND, STORE_STATUS } from "@/shared/constants/store";
import { USER_ROLES } from "@/shared/constants/user";
import { orderItemSchema, orderSchema, type Order, type OrderItem } from "@/shared/schemas/order";
import { storeSchema, type Store } from "@/shared/schemas/store";
import { userSchema, type User } from "@/shared/schemas/user";

export function createUser(overrides: Partial<User> = {}): User {
  const id = crypto.randomUUID();
  return userSchema.parse({
    id: `user-${id}`,
    email: `user-${id}@test.com`,
    role: USER_ROLES.client,
    ...overrides,
  });
}

export function createStore(overrides: Partial<Store> = {}): Store {
  return storeSchema.parse({
    id: `store-${crypto.randomUUID()}`,
    name: `Test Store ${crypto.randomUUID().slice(0, 8)}`,
    kind: STORE_KIND.foodTruck,
    photoUrl: "https://example.com/photo.jpg",
    location: { lat: -34.6037, lng: -58.3816 },
    distanceMeters: 500,
    status: STORE_STATUS.open,
    priceFromArs: 1000,
    tagline: "La mejor comida de la cuadra",
    ownerId: crypto.randomUUID(),
    ...overrides,
  });
}

export function createOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  const id = crypto.randomUUID();
  return orderItemSchema.parse({
    productId: `product-${id}`,
    productName: `Product ${id.slice(0, 8)}`,
    productPriceArs: 500,
    quantity: 1,
    ...overrides,
  });
}

export function createOrder(overrides: Partial<Order> = {}): Order {
  const now = new Date().toISOString();
  return orderSchema.parse({
    id: `order-${crypto.randomUUID()}`,
    clientId: `client-${crypto.randomUUID()}`,
    storeId: `store-${crypto.randomUUID()}`,
    status: ORDER_STATUS.ENVIADO,
    items: [createOrderItem()],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}
