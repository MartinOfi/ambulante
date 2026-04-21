"use client";

import { useMemo, type RefObject } from "react";
import { Map, Marker, NavigationControl, Source, Layer } from "react-map-gl/maplibre";
import type { MapRef, ViewState, MapMouseEvent } from "react-map-gl/maplibre";
import type { GeoJSON } from "geojson";
import type { Coordinates } from "@/shared/schemas/coordinates";
import {
  MAP_DEFAULTS,
  MAP_STYLE_URL,
  MAP_SOURCE_ID,
  MAP_LAYER_IDS,
  MAP_PIN_COLORS,
} from "@/features/map/constants";
import type { ClusterFeature } from "@/features/map/hooks/useClusters";
import { UserLocationPin } from "./UserLocationPin";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapCanvasProps {
  readonly clusters: readonly ClusterFeature[];
  readonly hasUserLocation: boolean;
  readonly userCoords?: Coordinates;
  readonly selectedStoreId?: string | null;
  readonly viewState: ViewState;
  readonly mapRef?: RefObject<MapRef | null>;
  readonly onMove: (evt: { viewState: ViewState }) => void;
  readonly onLoad?: () => void;
  readonly onSelectStore?: (id: string) => void;
  readonly onZoomToCluster?: (clusterId: number, lng: number, lat: number) => void;
}

const INTERACTIVE_LAYER_IDS = [
  MAP_LAYER_IDS.CLUSTERS_CIRCLE,
  MAP_LAYER_IDS.STORES_CIRCLE,
  MAP_LAYER_IDS.STORES_ACTIVE,
] as const;

function toFeatureCollection(clusters: readonly ClusterFeature[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [...clusters] as GeoJSON.Feature[],
  };
}

export function MapCanvas({
  clusters,
  hasUserLocation,
  userCoords,
  selectedStoreId,
  viewState,
  mapRef,
  onMove,
  onLoad,
  onSelectStore,
  onZoomToCluster,
}: MapCanvasProps) {
  const geojson = useMemo(() => toFeatureCollection(clusters), [clusters]);

  function handleMapClick(e: MapMouseEvent) {
    const feature = e.features?.[0];
    if (!feature) return;
    if (feature.geometry.type !== "Point") return;

    const [lng, lat] = feature.geometry.coordinates as [number, number];
    const layerId = feature.layer.id;

    if (layerId === MAP_LAYER_IDS.STORES_CIRCLE || layerId === MAP_LAYER_IDS.STORES_ACTIVE) {
      const storeId = feature.properties?.storeId as string | undefined;
      if (storeId) onSelectStore?.(storeId);
      return;
    }

    if (layerId === MAP_LAYER_IDS.CLUSTERS_CIRCLE) {
      const clusterId = feature.properties?.cluster_id as number | undefined;
      if (clusterId !== undefined) onZoomToCluster?.(clusterId, lng, lat);
    }
  }

  return (
    <div className="absolute inset-0">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={onMove}
        onLoad={onLoad}
        onClick={handleMapClick}
        interactiveLayerIds={INTERACTIVE_LAYER_IDS as unknown as string[]}
        mapStyle={MAP_STYLE_URL}
        minZoom={MAP_DEFAULTS.MIN_ZOOM}
        maxZoom={MAP_DEFAULTS.MAX_ZOOM}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />

        <Source id={MAP_SOURCE_ID} type="geojson" data={geojson} cluster={false}>
          <Layer
            id={MAP_LAYER_IDS.CLUSTERS_CIRCLE}
            type="circle"
            filter={["==", ["get", "cluster"], true]}
            paint={{
              "circle-color": MAP_PIN_COLORS.CLUSTER,
              "circle-radius": ["interpolate", ["linear"], ["get", "point_count"], 2, 20, 10, 30],
              "circle-stroke-width": 2,
              "circle-stroke-color": MAP_PIN_COLORS.CLUSTER_TEXT,
            }}
          />
          <Layer
            id={MAP_LAYER_IDS.CLUSTERS_LABEL}
            type="symbol"
            filter={["==", ["get", "cluster"], true]}
            layout={{
              "text-field": ["get", "point_count_abbreviated"],
              "text-size": 13,
              "text-allow-overlap": true,
            }}
            paint={{ "text-color": MAP_PIN_COLORS.CLUSTER_TEXT }}
          />
          <Layer
            id={MAP_LAYER_IDS.STORES_CIRCLE}
            type="circle"
            filter={["==", ["get", "cluster"], false]}
            paint={{
              "circle-color": MAP_PIN_COLORS.STORE,
              "circle-radius": 10,
              "circle-stroke-width": 2,
              "circle-stroke-color": MAP_PIN_COLORS.CLUSTER_TEXT,
            }}
          />
          <Layer
            id={MAP_LAYER_IDS.STORES_ACTIVE}
            type="circle"
            filter={[
              "all",
              ["==", ["get", "cluster"], false],
              ["==", ["get", "storeId"], selectedStoreId ?? ""],
            ]}
            paint={{
              "circle-color": MAP_PIN_COLORS.STORE_ACTIVE,
              "circle-radius": 13,
              "circle-stroke-width": 3,
              "circle-stroke-color": MAP_PIN_COLORS.CLUSTER_TEXT,
            }}
          />
        </Source>

        {hasUserLocation && userCoords && (
          <Marker longitude={userCoords.lng} latitude={userCoords.lat} anchor="center">
            <UserLocationPin />
          </Marker>
        )}
      </Map>
    </div>
  );
}
