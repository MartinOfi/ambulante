"use client";

import { useCallback } from "react";
import { useGeolocation } from "@/shared/hooks/useGeolocation";
import { MAX_EXPAND_RADIUS } from "@/features/map/constants";
import { useRadiusParam } from "@/features/map/hooks/useRadiusParam";
import { useStoresNearbyQuery } from "@/features/map/hooks/useStoresNearbyQuery";
import { MapScreen } from "./MapScreen";

export function MapScreenContainer() {
  const [radius, setRadius] = useRadiusParam();
  const geo = useGeolocation();

  const coords = geo.status === "granted" ? geo.coords : null;
  const { data: stores = [] } = useStoresNearbyQuery({ coords, radius });

  const handleExpandRadius = useCallback(() => {
    setRadius(MAX_EXPAND_RADIUS);
  }, [setRadius]);

  const handleRecenter = useCallback(() => {
    geo.request();
  }, [geo.request]);

  const handleManualSearch = useCallback(() => {}, []);

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
