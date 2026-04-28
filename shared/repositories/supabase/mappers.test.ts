import { describe, it, expect } from "vitest";
import {
  dbRoleToDomain,
  domainRoleToDb,
  dbStatusToDomain,
  domainStatusToDb,
  dbCategoryToKind,
  dbAvailableToStatus,
  mapUserRow,
  mapStoreRow,
  mapProductRow,
  mapOrderItemRow,
  mapOrderRow,
  mapPushSubscriptionRow,
} from "./mappers";

describe("dbRoleToDomain", () => {
  it("maps cliente → client", () => expect(dbRoleToDomain("cliente")).toBe("client"));
  it("maps tienda → store", () => expect(dbRoleToDomain("tienda")).toBe("store"));
  it("maps admin → admin", () => expect(dbRoleToDomain("admin")).toBe("admin"));
  it("throws on unknown role", () => expect(() => dbRoleToDomain("unknown")).toThrow());
});

describe("domainRoleToDb", () => {
  it("maps client → cliente", () => expect(domainRoleToDb("client")).toBe("cliente"));
  it("maps store → tienda", () => expect(domainRoleToDb("store")).toBe("tienda"));
  it("maps admin → admin", () => expect(domainRoleToDb("admin")).toBe("admin"));
});

describe("dbStatusToDomain / domainStatusToDb", () => {
  it("uppercases enviado → ENVIADO", () => expect(dbStatusToDomain("enviado")).toBe("ENVIADO"));
  it("uppercases en_camino → EN_CAMINO", () =>
    expect(dbStatusToDomain("en_camino")).toBe("EN_CAMINO"));
  it("lowercases FINALIZADO → finalizado", () =>
    expect(domainStatusToDb("FINALIZADO")).toBe("finalizado"));
  it("round-trips all statuses", () => {
    const statuses = [
      "enviado",
      "recibido",
      "aceptado",
      "en_camino",
      "finalizado",
      "rechazado",
      "cancelado",
      "expirado",
    ];
    for (const s of statuses) {
      expect(domainStatusToDb(dbStatusToDomain(s))).toBe(s);
    }
  });
});

describe("dbCategoryToKind", () => {
  it("maps food-truck correctly", () => expect(dbCategoryToKind("food-truck")).toBe("food-truck"));
  it("maps street-cart correctly", () =>
    expect(dbCategoryToKind("street-cart")).toBe("street-cart"));
  it("maps ice-cream correctly", () => expect(dbCategoryToKind("ice-cream")).toBe("ice-cream"));
  it("falls back to food-truck for null", () => expect(dbCategoryToKind(null)).toBe("food-truck"));
  it("throws for unknown category", () =>
    expect(() => dbCategoryToKind("unknown")).toThrow('unknown category "unknown"'));
});

describe("dbAvailableToStatus", () => {
  it("maps true → open", () => expect(dbAvailableToStatus(true)).toBe("open"));
  it("maps false → closed", () => expect(dbAvailableToStatus(false)).toBe("closed"));
});

describe("mapUserRow", () => {
  it("maps all fields correctly", () => {
    const row = {
      public_id: "uuid-1",
      role: "cliente",
      display_name: "Maria",
      email: "m@test.com",
      suspended: false,
    };
    const user = mapUserRow(row);
    expect(user).toEqual({
      id: "uuid-1",
      role: "client",
      displayName: "Maria",
      email: "m@test.com",
      suspended: false,
    });
  });

  it("defaults email to empty string when null", () => {
    const row = {
      public_id: "uuid-2",
      role: "tienda",
      display_name: null,
      email: null,
      suspended: null,
    };
    const user = mapUserRow(row);
    expect(user.email).toBe("");
    expect(user.displayName).toBeUndefined();
    expect(user.suspended).toBeUndefined();
  });
});

describe("mapStoreRow", () => {
  const baseRow = {
    public_id: "store-uuid",
    owner_public_id: "owner-uuid",
    name: "El Pibe",
    description: "Choripanes",
    category: "food-truck",
    available: true,
    photo_url: "https://example.com/photo.jpg",
    tagline: "Los mejores",
    price_from_ars: "1500.00",
    hours: "10-20",
    lat: -34.6,
    lng: -58.4,
    distance_meters: 250.5,
  };

  it("maps all fields correctly", () => {
    const store = mapStoreRow(baseRow as Parameters<typeof mapStoreRow>[0]);
    expect(store.id).toBe("store-uuid");
    expect(store.ownerId).toBe("owner-uuid");
    expect(store.kind).toBe("food-truck");
    expect(store.status).toBe("open");
    expect(store.priceFromArs).toBe(1500);
    expect(store.location).toEqual({ lat: -34.6, lng: -58.4 });
    expect(store.distanceMeters).toBe(250.5);
  });

  it("defaults missing optional fields", () => {
    const row = {
      ...baseRow,
      photo_url: null,
      tagline: null,
      price_from_ars: null,
      hours: null,
      lat: null,
      lng: null,
      distance_meters: null,
    };
    const store = mapStoreRow(row as Parameters<typeof mapStoreRow>[0]);
    expect(store.photoUrl).toContain("placeholder");
    expect(store.tagline).toBe("");
    expect(store.priceFromArs).toBe(0);
    expect(store.hours).toBeUndefined();
    expect(store.location).toEqual({ lat: 0, lng: 0 });
    expect(store.distanceMeters).toBe(0);
  });
});

describe("mapProductRow", () => {
  it("maps all fields correctly", () => {
    const row = {
      public_id: "prod-uuid",
      store: { public_id: "store-uuid" },
      name: "Choripán",
      description: "Con chimichurri",
      price: "350.00",
      image_url: "https://example.com/chori.jpg",
      available: true,
    };
    const product = mapProductRow(row as Parameters<typeof mapProductRow>[0]);
    expect(product.id).toBe("prod-uuid");
    expect(product.storeId).toBe("store-uuid");
    expect(product.priceArs).toBe(350);
    expect(product.photoUrl).toBe("https://example.com/chori.jpg");
    expect(product.isAvailable).toBe(true);
  });

  it("handles null store and optional fields", () => {
    const row = {
      public_id: "p2",
      store: null,
      name: "X",
      description: null,
      price: 100,
      image_url: null,
      available: false,
    };
    const product = mapProductRow(row as Parameters<typeof mapProductRow>[0]);
    expect(product.storeId).toBe("");
    expect(product.description).toBeUndefined();
    expect(product.photoUrl).toBeUndefined();
  });
});

describe("mapOrderItemRow", () => {
  it("reads domain field names from snapshot", () => {
    const row = {
      product_snapshot: { productId: "p1", productName: "Empanada", productPriceArs: 200 },
      quantity: 3,
    };
    const item = mapOrderItemRow(row);
    expect(item).toEqual({
      productId: "p1",
      productName: "Empanada",
      productPriceArs: 200,
      quantity: 3,
    });
  });

  it("falls back to legacy field names", () => {
    const row = { product_snapshot: { id: "p2", name: "Alfajor", price: 150 }, quantity: 2 };
    const item = mapOrderItemRow(row);
    expect(item.productId).toBe("p2");
    expect(item.productName).toBe("Alfajor");
    expect(item.productPriceArs).toBe(150);
  });
});

describe("mapOrderRow", () => {
  it("maps full order row", () => {
    const row = {
      public_id: "order-uuid",
      status: "aceptado",
      customer_note: "Sin cebolla",
      created_at: "2026-04-28T10:00:00Z",
      updated_at: "2026-04-28T10:05:00Z",
      customer: { public_id: "client-uuid" },
      store: { public_id: "store-uuid" },
      items: [
        {
          product_snapshot: { productId: "p1", productName: "X", productPriceArs: 100 },
          quantity: 1,
        },
      ],
    };
    const order = mapOrderRow(row as Parameters<typeof mapOrderRow>[0]);
    expect(order.id).toBe("order-uuid");
    expect(order.status).toBe("ACEPTADO");
    expect(order.clientId).toBe("client-uuid");
    expect(order.storeId).toBe("store-uuid");
    expect(order.notes).toBe("Sin cebolla");
    expect(order.items).toHaveLength(1);
  });

  it("handles null customer/store gracefully", () => {
    const row = {
      public_id: "o2",
      status: "enviado",
      customer_note: null,
      created_at: "2026-04-28T10:00:00Z",
      updated_at: "2026-04-28T10:00:00Z",
      customer: null,
      store: null,
      items: [],
    };
    const order = mapOrderRow(row as Parameters<typeof mapOrderRow>[0]);
    expect(order.clientId).toBe("");
    expect(order.storeId).toBe("");
    expect(order.notes).toBeUndefined();
  });
});

describe("mapPushSubscriptionRow", () => {
  it("maps all fields correctly", () => {
    const row = {
      id: 42,
      user: { public_id: "user-uuid" },
      endpoint: "https://push.example.com/sub/1",
      p256dh: "key1",
      auth_key: "authkey1",
      user_agent: "Mozilla/5.0",
      created_at: "2026-04-28T00:00:00Z",
    };
    const sub = mapPushSubscriptionRow(row as Parameters<typeof mapPushSubscriptionRow>[0]);
    expect(sub.id).toBe("42");
    expect(sub.userId).toBe("user-uuid");
    expect(sub.endpoint).toBe("https://push.example.com/sub/1");
    expect(sub.userAgent).toBe("Mozilla/5.0");
  });

  it("handles null user_agent", () => {
    const row = {
      id: 1,
      user: null,
      endpoint: "e",
      p256dh: "k",
      auth_key: "a",
      user_agent: null,
      created_at: "2026-01-01T00:00:00Z",
    };
    const sub = mapPushSubscriptionRow(row as Parameters<typeof mapPushSubscriptionRow>[0]);
    expect(sub.userId).toBe("");
    expect(sub.userAgent).toBeUndefined();
  });
});
