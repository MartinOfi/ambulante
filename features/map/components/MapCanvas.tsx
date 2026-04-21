"use client";

import { useState, useCallback } from "react";
import { Map, Marker, NavigationControl } from "react-map-gl/maplibre";
import type { ViewState } from "react-map-gl/maplibre";
import type { Store } from "@/shared/types/store";
import type { Coordinates } from "@/shared/schemas/coordinates";
import { MAP_DEFAULTS } from "@/features/map/constants";
import { StorePin } from "./StorePin";
import { UserLocationPin } from "./UserLocationPin";
import "maplibre-gl/dist/maplibre-gl.css";

const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://demotiles.maplibre.org/style.json";

export interface MapCanvasProps {
  readonly stores: readonly Store[];
  readonly hasUserLocation: boolean;
  readonly userCoords?: Coordinates;
  readonly selectedStoreId?: string | null;
  readonly onSelectStore?: (id: string) => void;
}

function buildInitialViewState(userCoords: Coordinates | undefined): ViewState {
  const center = userCoords ?? MAP_DEFAULTS.CENTER;
  return {
    longitude: center.lng,
    latitude: center.lat,
    zoom: MAP_DEFAULTS.ZOOM,
    bearing: 0,
    pitch: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  };
}

export function MapCanvas({
  stores,
  hasUserLocation,
  userCoords,
  selectedStoreId,
  onSelectStore,
}: MapCanvasProps) {
  const [viewState, setViewState] = useState<ViewState>(() => buildInitialViewState(userCoords));

  const handleMove = useCallback((evt: { viewState: ViewState }) => {
    setViewState(evt.viewState);
  }, []);

  return (
    <div className="absolute inset-0">
      <Map
        {...viewState}
        onMove={handleMove}
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
