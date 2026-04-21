import { describe, it, expect } from "vitest";
import { computeClusters } from "./useClusters";
import type { Store } from "@/shared/types/store";

const makeStore = (id: string, lat: number, lng: number): Store => ({
  id,
  name: `Tienda ${id}`,
  kind: "food-truck",
  photoUrl: "https://example.com/photo.jpg",
  location: { lat, lng },
  distanceMeters: 100,
  status: "open",
  priceFromArs: 500,
  tagline: "Rico y rápido",
  ownerId: "550e8400-e29b-41d4-a716-446655440000",
});

const BA_BBOX: [number, number, number, number] = [-58.42, -34.63, -58.34, -34.58];

describe("computeClusters", () => {
  it("returns empty array when no stores", () => {
    const result = computeClusters({ stores: [], bbox: BA_BBOX, zoom: 14 });
    expect(result).toHaveLength(0);
  });

  it("returns each store as individual point at high zoom", () => {
    const stores: Store[] = [
      makeStore("a", -34.603, -58.381),
      makeStore("b", -34.605, -58.382),
      makeStore("c", -34.608, -58.39),
    ];
    const result = computeClusters({ stores, bbox: BA_BBOX, zoom: 18 });
    const points = result.filter((f) => !f.properties.cluster);
    expect(points).toHaveLength(3);
  });

  it("clusters nearby stores at low zoom", () => {
    const stores: Store[] = [makeStore("a", -34.603, -58.381), makeStore("b", -34.6031, -58.3811)];
    const result = computeClusters({ stores, bbox: BA_BBOX, zoom: 10 });
    const clusters = result.filter((f) => f.properties.cluster === true);
    expect(clusters.length).toBeGreaterThan(0);
  });

  it("cluster feature carries point_count", () => {
    const stores: Store[] = [makeStore("a", -34.603, -58.381), makeStore("b", -34.6031, -58.3811)];
    const result = computeClusters({ stores, bbox: BA_BBOX, zoom: 10 });
    const cluster = result.find((f) => f.properties.cluster === true);
    if (cluster && cluster.properties.cluster) {
      expect(cluster.properties.point_count).toBeGreaterThanOrEqual(2);
    } else {
      throw new Error("Expected a cluster feature with point_count");
    }
  });

  it("individual point feature carries store id", () => {
    const stores: Store[] = [makeStore("store-42", -34.603, -58.381)];
    const result = computeClusters({ stores, bbox: BA_BBOX, zoom: 18 });
    const point = result.find((f) => !f.properties.cluster);
    const props = point?.properties;
    if (props && !props.cluster) {
      expect(props.storeId).toBe("store-42");
    } else {
      throw new Error("Expected a non-cluster point feature");
    }
  });
});
