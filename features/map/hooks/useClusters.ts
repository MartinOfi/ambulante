import { useMemo, useCallback } from "react";
import Supercluster from "supercluster";
import type { BBox } from "geojson";
import type { ViewState } from "react-map-gl/maplibre";
import type { Store, StoreKind } from "@/shared/types/store";
import { CLUSTER_CONFIG } from "@/features/map/constants";

export interface StorePointProperties {
  readonly cluster: false;
  readonly storeId: string;
  readonly storeKind: StoreKind;
  readonly storeName: string;
}

export interface ClusterProperties {
  readonly cluster: true;
  readonly cluster_id: number;
  readonly point_count: number;
  readonly point_count_abbreviated: number | string;
}

export type ClusterFeatureProperties = StorePointProperties | ClusterProperties;

export interface ClusterFeature {
  readonly type: "Feature";
  // GeoJSON Position is number[] — we consume only indices 0 and 1 as [lng, lat]
  readonly geometry: { readonly type: "Point"; readonly coordinates: number[] };
  readonly properties: ClusterFeatureProperties;
}

export interface ComputeClustersInput {
  readonly stores: readonly Store[];
  readonly bbox: BBox;
  readonly zoom: number;
}

function buildIndex(stores: readonly Store[]): Supercluster<StorePointProperties> {
  const index = new Supercluster<StorePointProperties>({
    radius: CLUSTER_CONFIG.RADIUS,
    extent: CLUSTER_CONFIG.EXTENT,
    maxZoom: CLUSTER_CONFIG.MAX_ZOOM,
  });

  const points = stores.map((store) => ({
    type: "Feature" as const,
    geometry: {
      type: "Point" as const,
      coordinates: [store.location.lng, store.location.lat] as [number, number],
    },
    properties: {
      cluster: false as const,
      storeId: store.id,
      storeKind: store.kind,
      storeName: store.name,
    },
  }));

  index.load(points);
  return index;
}

// NOTE: not memoised — callers must wrap in useMemo if called on every render
export function computeClusters({ stores, bbox, zoom }: ComputeClustersInput): ClusterFeature[] {
  if (stores.length === 0) return [];

  const index = buildIndex(stores);
  // getClusters returns GeoJSON Features whose coordinates are number[]; shape matches ClusterFeature at runtime
  return index.getClusters(
    bbox as [number, number, number, number],
    Math.round(zoom),
  ) as ClusterFeature[];
}

export interface UseClustersInput {
  readonly stores: readonly Store[];
  readonly viewState: ViewState;
  readonly bounds: BBox;
}

export interface UseClustersOutput {
  readonly clusters: ClusterFeature[];
  readonly getExpansionZoom: (clusterId: number) => number;
}

export function useClusters({ stores, viewState, bounds }: UseClustersInput): UseClustersOutput {
  const index = useMemo(() => buildIndex(stores), [stores]);

  const clusters = useMemo(() => {
    if (stores.length === 0) return [];
    return index.getClusters(
      bounds as [number, number, number, number],
      Math.round(viewState.zoom),
    ) as ClusterFeature[];
  }, [index, bounds, viewState.zoom, stores.length]);

  const getExpansionZoom = useCallback(
    (clusterId: number) => index.getClusterExpansionZoom(clusterId),
    [index],
  );

  return { clusters, getExpansionZoom };
}
