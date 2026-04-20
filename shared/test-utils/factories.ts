import { ORDER_STATUS } from "@/shared/constants/order";
import { orderItemSchema, orderSchema, type Order, type OrderItem } from "@/shared/schemas/order";
import { storeSchema, type Store } from "@/shared/schemas/store";
import { userSchema, type User } from "@/shared/schemas/user";

let _seq = 0;

const nextSeq = (): number => ++_seq;

const FAKE_UUID_PREFIX = "00000000-0000-0000-0000-";
const toFakeUuid = (seqNum: number): string =>
  `${FAKE_UUID_PREFIX}${String(seqNum).padStart(12, "0")}`;

export function createUser(overrides: Partial<User> = {}): User {
  const seqNum = nextSeq();
  return userSchema.parse({
    id: `user-${seqNum}`,
    email: `user${seqNum}@test.com`,
    role: "client",
    ...overrides,
  });
}

export function createStore(overrides: Partial<Store> = {}): Store {
  const seqNum = nextSeq();
  return storeSchema.parse({
    id: `store-${seqNum}`,
    name: `Test Store ${seqNum}`,
    kind: "food-truck",
    photoUrl: "https://example.com/photo.jpg",
    location: { lat: -34.6037, lng: -58.3816 },
    distanceMeters: 500,
    status: "open",
    priceFromArs: 1000,
    tagline: "La mejor comida de la cuadra",
    ownerId: toFakeUuid(seqNum),
    ...overrides,
  });
}

export function createOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  const seqNum = nextSeq();
  return orderItemSchema.parse({
    productId: `product-${seqNum}`,
    productName: `Product ${seqNum}`,
    productPriceArs: 500,
    quantity: 1,
    ...overrides,
  });
}

export function createOrder(overrides: Partial<Order> = {}): Order {
  const seqNum = nextSeq();
  const now = new Date().toISOString();
  return orderSchema.parse({
    id: `order-${seqNum}`,
    clientId: `client-${seqNum}`,
    storeId: `store-${seqNum}`,
    status: ORDER_STATUS.ENVIADO,
    items: [createOrderItem()],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}
