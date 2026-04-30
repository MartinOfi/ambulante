import { describe, it, expect } from "vitest";
import type { Order } from "@/shared/schemas/order";
import type { Store } from "@/shared/schemas/store";
import type { OrderRepository } from "@/shared/repositories/order";
import type { StoreRepository } from "@/shared/repositories/store";
import { createKpiDashboardService } from "./kpi-dashboard.service";

function makeOrderRepo(orders: readonly Order[]): OrderRepository {
  return {
    findAll: async () => orders,
    findById: async () => null,
    create: async (i) => i as unknown as Order,
    update: async () => orders[0]!,
    delete: async () => undefined,
    findByCustomer: async () => ({ orders: [], nextCursor: null }),
  };
}

function makeStoreRepo(stores: readonly Store[]): StoreRepository {
  return {
    findAll: async () => stores,
    findById: async () => null,
    create: async (i) => i as unknown as Store,
    update: async () => stores[0]!,
    delete: async () => undefined,
    findNearby: async () => [],
    findByOwnerId: async () => null,
  };
}

const BASE_ORDER: Order = {
  id: "o1",
  clientId: "c1",
  storeId: "s1",
  status: "ACEPTADO",
  items: [{ productId: "p1", productName: "x", productPriceArs: 100, quantity: 1 }],
  createdAt: new Date("2026-01-01T10:00:00Z").toISOString(),
  updatedAt: new Date("2026-01-01T10:02:00Z").toISOString(),
};

const BASE_STORE: Store = {
  id: "s1",
  name: "Tienda A",
  kind: "food-truck",
  photoUrl: "https://example.com/photo.jpg",
  location: { lat: -34.6, lng: -58.3 },
  distanceMeters: 100,
  status: "open",
  priceFromArs: 500,
  tagline: "tagline",
  ownerId: "11111111-1111-1111-1111-111111111111",
};

describe("createKpiDashboardService", () => {
  it("returns a snapshot with 0 values when no orders exist", async () => {
    const svc = createKpiDashboardService(makeOrderRepo([]), makeStoreRepo([]));
    const snap = await svc.fetchKpiSnapshot();

    expect(snap.ordersPerDay).toBe(0);
    expect(snap.acceptanceRate).toBe(0);
    expect(snap.completionRate).toBe(0);
    expect(snap.avgResponseTimeMs).toBe(0);
    expect(snap.expirationRate).toBe(0);
    expect(snap.activeStoresConcurrent).toBe(0);
  });

  it("computes acceptanceRate from ACEPTADO vs RECHAZADO", async () => {
    const orders: Order[] = [
      { ...BASE_ORDER, id: "o1", status: "ACEPTADO" },
      { ...BASE_ORDER, id: "o2", status: "ACEPTADO" },
      { ...BASE_ORDER, id: "o3", status: "RECHAZADO" },
    ];
    const svc = createKpiDashboardService(makeOrderRepo(orders), makeStoreRepo([]));
    const snap = await svc.fetchKpiSnapshot();

    expect(snap.acceptanceRate).toBeCloseTo(2 / 3);
  });

  it("computes completionRate from FINALIZADO vs accepted-ever bucket", async () => {
    const orders: Order[] = [
      { ...BASE_ORDER, id: "o1", status: "FINALIZADO" },
      { ...BASE_ORDER, id: "o2", status: "FINALIZADO" },
      { ...BASE_ORDER, id: "o3", status: "ACEPTADO" },
    ];
    const svc = createKpiDashboardService(makeOrderRepo(orders), makeStoreRepo([]));
    const snap = await svc.fetchKpiSnapshot();

    expect(snap.completionRate).toBeCloseTo(2 / 3);
  });

  it("computes expirationRate from EXPIRADO / total", async () => {
    const orders: Order[] = [
      { ...BASE_ORDER, id: "o1", status: "EXPIRADO" },
      { ...BASE_ORDER, id: "o2", status: "ACEPTADO" },
      { ...BASE_ORDER, id: "o3", status: "ACEPTADO" },
      { ...BASE_ORDER, id: "o4", status: "ACEPTADO" },
    ];
    const svc = createKpiDashboardService(makeOrderRepo(orders), makeStoreRepo([]));
    const snap = await svc.fetchKpiSnapshot();

    expect(snap.expirationRate).toBeCloseTo(0.25);
  });

  it("computes avgResponseTimeMs from ACEPTADO updatedAt - createdAt", async () => {
    const orders: Order[] = [
      {
        ...BASE_ORDER,
        id: "o1",
        status: "ACEPTADO",
        createdAt: new Date("2026-01-01T10:00:00Z").toISOString(),
        updatedAt: new Date("2026-01-01T10:02:00Z").toISOString(), // 120_000 ms
      },
      {
        ...BASE_ORDER,
        id: "o2",
        status: "ACEPTADO",
        createdAt: new Date("2026-01-01T11:00:00Z").toISOString(),
        updatedAt: new Date("2026-01-01T11:04:00Z").toISOString(), // 240_000 ms
      },
    ];
    const svc = createKpiDashboardService(makeOrderRepo(orders), makeStoreRepo([]));
    const snap = await svc.fetchKpiSnapshot();

    expect(snap.avgResponseTimeMs).toBe(180_000); // (120k + 240k) / 2
  });

  it("counts open stores for activeStoresConcurrent", async () => {
    const stores: Store[] = [
      { ...BASE_STORE, id: "s1", status: "open" },
      { ...BASE_STORE, id: "s2", status: "open" },
      { ...BASE_STORE, id: "s3", status: "closed" },
      { ...BASE_STORE, id: "s4", status: "stale" },
    ];
    const svc = createKpiDashboardService(makeOrderRepo([]), makeStoreRepo(stores));
    const snap = await svc.fetchKpiSnapshot();

    expect(snap.activeStoresConcurrent).toBe(2);
  });

  it("returns computedAt as a Date and period as day", async () => {
    const svc = createKpiDashboardService(makeOrderRepo([]), makeStoreRepo([]));
    const snap = await svc.fetchKpiSnapshot();

    expect(snap.computedAt).toBeInstanceOf(Date);
    expect(snap.period).toBe("day");
  });

  it("clamps avgResponseTimeMs at 0 when updatedAt is before createdAt", async () => {
    const orders: Order[] = [
      {
        ...BASE_ORDER,
        id: "o1",
        status: "ACEPTADO",
        createdAt: new Date("2026-01-01T10:05:00Z").toISOString(),
        updatedAt: new Date("2026-01-01T10:00:00Z").toISOString(),
      },
    ];
    const svc = createKpiDashboardService(makeOrderRepo(orders), makeStoreRepo([]));
    const snap = await svc.fetchKpiSnapshot();

    expect(snap.avgResponseTimeMs).toBe(0);
  });
});
