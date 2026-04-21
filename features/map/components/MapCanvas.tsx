"use client";

import { type RefObject } from "react";
import { Map, Marker, NavigationControl } from "react-map-gl/maplibre";
import type { MapRef, ViewState } from "react-map-gl/maplibre";
import type { Coordinates } from "@/shared/schemas/coordinates";
import { MAP_DEFAULTS, MAP_STYLE_URL } from "@/features/map/constants";
import type { ClusterFeature } from "@/features/map/hooks/useClusters";
import { StorePin } from "./StorePin";
import { UserLocationPin } from "./UserLocationPin";
import { ClusterPin } from "./ClusterPin";
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
  return (
    <div className="absolute inset-0">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={onMove}
        onLoad={onLoad}
        mapStyle={MAP_STYLE_URL}
        minZoom={MAP_DEFAULTS.MIN_ZOOM}
        maxZoom={MAP_DEFAULTS.MAX_ZOOM}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />

        {clusters.map((feature, index) => {
          const [lng, lat] = feature.geometry.coordinates;

          if (feature.properties.cluster) {
            const { cluster_id, point_count } = feature.properties;
            return (
              <Marker key={`cluster-${cluster_id}`} longitude={lng} latitude={lat} anchor="center">
                <ClusterPin
                  count={point_count}
                  onClick={() => onZoomToCluster?.(cluster_id, lng, lat)}
                />
              </Marker>
            );
          }

          const { storeId, storeKind, storeName } = feature.properties;
          return (
            <Marker
              key={`store-${storeId}-${index}`}
              longitude={lng}
              latitude={lat}
              anchor="bottom"
            >
              <StorePin
                kind={storeKind}
                label={storeName}
                active={selectedStoreId === storeId}
                onClick={() => onSelectStore?.(storeId)}
              />
            </Marker>
          );
        })}

        {hasUserLocation && userCoords && (
          <Marker longitude={userCoords.lng} latitude={userCoords.lat} anchor="center">
            <UserLocationPin />
          </Marker>
        )}
      </Map>
    </div>
  );
}
