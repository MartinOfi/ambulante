"use client";

import { Map, Marker, NavigationControl } from "react-map-gl/maplibre";
import type { ViewState } from "react-map-gl/maplibre";
import type { Store } from "@/shared/types/store";
import type { Coordinates } from "@/shared/schemas/coordinates";
import { MAP_DEFAULTS, MAP_STYLE_URL } from "@/features/map/constants";
import { StorePin } from "./StorePin";
import { UserLocationPin } from "./UserLocationPin";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapCanvasProps {
  readonly stores: readonly Store[];
  readonly hasUserLocation: boolean;
  readonly userCoords?: Coordinates;
  readonly selectedStoreId?: string | null;
  readonly viewState: ViewState;
  readonly onMove: (evt: { viewState: ViewState }) => void;
  readonly onSelectStore?: (id: string) => void;
}

export function MapCanvas({
  stores,
  hasUserLocation,
  userCoords,
  selectedStoreId,
  viewState,
  onMove,
  onSelectStore,
}: MapCanvasProps) {
  return (
    <div className="absolute inset-0">
      <Map
        {...viewState}
        onMove={onMove}
        mapStyle={MAP_STYLE_URL}
        minZoom={MAP_DEFAULTS.MIN_ZOOM}
        maxZoom={MAP_DEFAULTS.MAX_ZOOM}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />

        {stores.map((store) => (
          <Marker
            key={store.id}
            longitude={store.location.lng}
            latitude={store.location.lat}
            anchor="bottom"
          >
            <StorePin
              kind={store.kind}
              label={store.name}
              active={selectedStoreId === store.id}
              onClick={() => onSelectStore?.(store.id)}
            />
          </Marker>
        ))}

        {hasUserLocation && userCoords && (
          <Marker longitude={userCoords.lng} latitude={userCoords.lat} anchor="center">
            <UserLocationPin />
          </Marker>
        )}
      </Map>
    </div>
  );
}
