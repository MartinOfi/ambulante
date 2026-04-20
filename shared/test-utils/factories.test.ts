import { describe, expect, it } from "vitest";
import { ORDER_STATUS } from "@/shared/constants/order";
import { orderItemSchema, orderSchema } from "@/shared/schemas/order";
import { storeSchema } from "@/shared/schemas/store";
import { userSchema } from "@/shared/schemas/user";
import { createOrder, createOrderItem, createStore, createUser } from "./factories";

describe("createUser", () => {
  it("returns a valid User by default", () => {
    const user = createUser();
    expect(() => userSchema.parse(user)).not.toThrow();
  });

  it("applies overrides", () => {
    const user = createUser({ role: "store", email: "store@test.com" });
    expect(user.role).toBe("store");
    expect(user.email).toBe("store@test.com");
  });

  it("produces unique ids on each call", () => {
    const a = createUser();
    const b = createUser();
    expect(a.id).not.toBe(b.id);
  });

  it("uses client role by default", () => {
    expect(createUser().role).toBe("client");
  });
});

describe("createStore", () => {
  it("returns a valid Store by default", () => {
    const store = createStore();
    expect(() => storeSchema.parse(store)).not.toThrow();
  });

  it("applies overrides", () => {
    const store = createStore({ status: "closed", name: "My Store" });
    expect(store.status).toBe("closed");
    expect(store.name).toBe("My Store");
  });

  it("produces unique ids on each call", () => {
    const a = createStore();
    const b = createStore();
    expect(a.id).not.toBe(b.id);
  });

  it("uses open status by default", () => {
    expect(createStore().status).toBe("open");
  });

  it("has a valid UUID for ownerId", () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(createStore().ownerId).toMatch(uuidRegex);
  });
});

describe("createOrderItem", () => {
  it("returns a valid OrderItem by default", () => {
    const item = createOrderItem();
    expect(() => orderItemSchema.parse(item)).not.toThrow();
  });

  it("applies overrides", () => {
    const item = createOrderItem({ quantity: 3, productName: "Pizza" });
    expect(item.quantity).toBe(3);
    expect(item.productName).toBe("Pizza");
  });

  it("produces unique productIds on each call", () => {
    const a = createOrderItem();
    const b = createOrderItem();
    expect(a.productId).not.toBe(b.productId);
  });
});

describe("createOrder", () => {
  it("returns a valid Order by default", () => {
    const order = createOrder();
    expect(() => orderSchema.parse(order)).not.toThrow();
  });

  it("starts in ENVIADO status by default", () => {
    expect(createOrder().status).toBe(ORDER_STATUS.ENVIADO);
  });

  it("applies overrides", () => {
    const order = createOrder({
      status: ORDER_STATUS.ACEPTADO,
      notes: "sin cebolla",
    });
    expect(order.status).toBe(ORDER_STATUS.ACEPTADO);
    expect(order.notes).toBe("sin cebolla");
  });

  it("produces unique ids on each call", () => {
    const a = createOrder();
    const b = createOrder();
    expect(a.id).not.toBe(b.id);
  });

  it("includes at least one item by default", () => {
    expect(createOrder().items.length).toBeGreaterThanOrEqual(1);
  });

  it("allows overriding items", () => {
    const items = [
      createOrderItem({ productName: "Empanada" }),
      createOrderItem({ productName: "Medialunas" }),
    ];
    const order = createOrder({ items });
    expect(order.items).toHaveLength(2);
    expect(order.items[0].productName).toBe("Empanada");
  });
});
