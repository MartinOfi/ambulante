"use client";

import { useCallback } from "react";
import { useGeolocation } from "@/shared/hooks/useGeolocation";
import { MAX_EXPAND_RADIUS } from "@/features/map/constants";
import { useRadiusParam } from "@/features/map/hooks/useRadiusParam";
import { useNearbyStores } from "@/features/map/hooks/useNearbyStores";
import { MapScreen } from "./MapScreen";

export function MapScreenContainer() {
  const [radius, setRadius] = useRadiusParam();
  const geo = useGeolocation();

  const coords = geo.status === "granted" ? geo.coords : null;
  const { stores } = useNearbyStores({ coords, radius });

  const handleExpandRadius = useCallback(() => {
    setRadius(MAX_EXPAND_RADIUS);
  }, []);

  const handleRecenter = useCallback(() => {
    geo.request();
  }, [geo]);

  const handleManualSearch = useCallback(() => {
    // TODO v2: abrir selector manual de zona (PRD §9.1)
  }, []);

  return (
    <MapScreen
      stores={stores}
      radius={radius}
      geo={geo}
      isRecentering={geo.status === "loading"}
      onRadiusChange={setRadius}
      onExpandRadius={handleExpandRadius}
      onRecenter={handleRecenter}
      onRetryGeolocation={handleRecenter}
      onManualSearch={handleManualSearch}
    />
  );
}
