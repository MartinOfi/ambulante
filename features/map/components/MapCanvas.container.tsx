"use client";

import { useState, useCallback, useRef } from "react";
import type { MapRef, ViewState } from "react-map-gl/maplibre";
import type { BBox } from "geojson";
import type { Coordinates, Store } from "@/shared/types/store";
import { MAP_DEFAULTS } from "@/features/map/constants";
import { useClusters } from "@/features/map/hooks/useClusters";
import { MapCanvas } from "./MapCanvas";

export interface MapCanvasContainerProps {
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

function extractBounds(mapRef: React.RefObject<MapRef | null>): BBox | null {
  if (!mapRef.current) return null;
  const raw = mapRef.current.getBounds().toArray();
  return [raw[0][0], raw[0][1], raw[1][0], raw[1][1]];
}

export function MapCanvasContainer(props: MapCanvasContainerProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [viewState, setViewState] = useState<ViewState>(() =>
    buildInitialViewState(props.userCoords),
  );
  const [bounds, setBounds] = useState<BBox | null>(null);

  const handleMove = useCallback((evt: { viewState: ViewState }) => {
    setViewState(evt.viewState);
    setBounds(extractBounds(mapRef));
  }, []);

  const handleLoad = useCallback(() => {
    setBounds(extractBounds(mapRef));
  }, []);

  const handleZoomToCluster = useCallback((_clusterId: number, lng: number, lat: number) => {
    setViewState((prev) => ({
      ...prev,
      longitude: lng,
      latitude: lat,
      zoom: Math.min(prev.zoom + 3, MAP_DEFAULTS.MAX_ZOOM),
    }));
  }, []);

  const clusters = useClusters({ stores: props.stores, viewState, bounds });

  return (
    <MapCanvas
      clusters={clusters}
      hasUserLocation={props.hasUserLocation}
      userCoords={props.userCoords}
      selectedStoreId={props.selectedStoreId}
      viewState={viewState}
      mapRef={mapRef}
      onMove={handleMove}
      onLoad={handleLoad}
      onSelectStore={props.onSelectStore}
      onZoomToCluster={handleZoomToCluster}
    />
  );
}
