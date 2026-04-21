"use client";

import { useMemo } from "react";
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
  readonly geometry: { readonly type: "Point"; readonly coordinates: readonly [number, number] };
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

export function computeClusters({ stores, bbox, zoom }: ComputeClustersInput): ClusterFeature[] {
  if (stores.length === 0) return [];

  const index = buildIndex(stores);
  const rawClusters = index.getClusters(bbox as [number, number, number, number], Math.round(zoom));

  return rawClusters as unknown as ClusterFeature[];
}

export interface UseClustersInput {
  readonly stores: readonly Store[];
  readonly viewState: ViewState;
  readonly bounds: BBox | null;
}

export function useClusters({ stores, viewState, bounds }: UseClustersInput): ClusterFeature[] {
  return useMemo(() => {
    if (!bounds) return [];
    return computeClusters({ stores, bbox: bounds, zoom: viewState.zoom });
  }, [stores, bounds, viewState.zoom]);
}
