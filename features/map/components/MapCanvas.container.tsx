"use client";

import { useState, useCallback } from "react";
import type { ViewState } from "react-map-gl/maplibre";
import type { Coordinates } from "@/shared/schemas/coordinates";
import { MAP_DEFAULTS } from "@/features/map/constants";
import { MapCanvas, type MapCanvasProps } from "./MapCanvas";

export type MapCanvasContainerProps = Omit<MapCanvasProps, "viewState" | "onMove">;

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

export function MapCanvasContainer(props: MapCanvasContainerProps) {
  const [viewState, setViewState] = useState<ViewState>(() =>
    buildInitialViewState(props.userCoords),
  );

  const handleMove = useCallback((evt: { viewState: ViewState }) => {
    setViewState(evt.viewState);
  }, []);

  return <MapCanvas {...props} viewState={viewState} onMove={handleMove} />;
}
