"use client";

import { useCallback, useState } from "react";
import { useGeolocation } from "@/shared/hooks/useGeolocation";
import { DEFAULT_RADIUS, type RadiusValue } from "@/shared/constants/radius";
import { MAX_EXPAND_RADIUS } from "@/features/map/constants";
import { useNearbyStores } from "@/features/map/hooks/useNearbyStores";
import { MapScreen } from "./MapScreen";

export function MapScreenContainer() {
  const [radius, setRadius] = useState<RadiusValue>(DEFAULT_RADIUS);
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
