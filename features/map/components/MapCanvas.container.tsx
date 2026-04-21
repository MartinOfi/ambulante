"use client";

import { useState, useCallback, useRef } from "react";
import type { RefObject } from "react";
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

// Approx bbox for a 375×667 viewport so clusters render before onLoad fires
function approximateBbox(viewState: ViewState): BBox {
  const degsPerPx = 360 / (Math.pow(2, viewState.zoom) * 256);
  const halfW = (degsPerPx * 375) / 2;
  const halfH = (degsPerPx * 667) / 2;
  return [
    viewState.longitude - halfW,
    viewState.latitude - halfH,
    viewState.longitude + halfW,
    viewState.latitude + halfH,
  ];
}

function extractBounds(mapRef: RefObject<MapRef | null>): BBox | null {
  if (!mapRef.current) return null;
  const raw = mapRef.current.getBounds().toArray();
  return [raw[0][0], raw[0][1], raw[1][0], raw[1][1]];
}

export function MapCanvasContainer(props: MapCanvasContainerProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [viewState, setViewState] = useState<ViewState>(() =>
    buildInitialViewState(props.userCoords),
  );
  const [bounds, setBounds] = useState<BBox>(() =>
    approximateBbox(buildInitialViewState(props.userCoords)),
  );

  const handleMove = useCallback((evt: { viewState: ViewState }) => {
    setViewState(evt.viewState);
    const exact = extractBounds(mapRef);
    if (exact) setBounds(exact);
  }, []);

  const handleLoad = useCallback(() => {
    const exact = extractBounds(mapRef);
    if (exact) setBounds(exact);
  }, []);

  const { clusters, getExpansionZoom } = useClusters({ stores: props.stores, viewState, bounds });

  const handleZoomToCluster = useCallback(
    (clusterId: number, lng: number, lat: number) => {
      const expansionZoom = getExpansionZoom(clusterId);
      setViewState((prev) => ({
        ...prev,
        longitude: lng,
        latitude: lat,
        zoom: Math.min(expansionZoom, MAP_DEFAULTS.MAX_ZOOM),
      }));
    },
    [getExpansionZoom],
  );

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
