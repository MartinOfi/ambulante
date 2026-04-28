"use client";

import { useCallback, useState } from "react";
import { useGeolocation } from "@/shared/hooks/useGeolocation";
import { MAX_EXPAND_RADIUS } from "@/features/map/constants";
import { useRadiusParam } from "@/features/map/hooks/useRadiusParam";
import { useStoresNearbyQuery } from "@/features/map/hooks/useStoresNearbyQuery";
import { useStoresAvailabilityRealtime } from "@/features/map/hooks/useStoresAvailabilityRealtime";
import { MapScreen } from "./MapScreen";

export function MapScreenContainer() {
  const [radius, setRadius] = useRadiusParam();
  const geo = useGeolocation();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const coords = geo.status === "granted" ? geo.coords : null;
  const { data: stores = [] } = useStoresNearbyQuery({ coords, radius });
  useStoresAvailabilityRealtime();

  const handleExpandRadius = useCallback(() => {
    setRadius(MAX_EXPAND_RADIUS);
  }, [setRadius]);

  const handleRecenter = useCallback(() => {
    geo.request();
  }, [geo.request]);

  const handleManualSearch = useCallback(() => {}, []);

  const handleSelectStore = useCallback((id: string) => {
    setSelectedStoreId(id);
  }, []);

  const handleDismissStoreDetail = useCallback(() => {
    setSelectedStoreId(null);
  }, []);

  return (
    <MapScreen
      stores={stores}
      radius={radius}
      geo={geo}
      isRecentering={geo.status === "loading"}
      selectedStoreId={selectedStoreId}
      onRadiusChange={setRadius}
      onExpandRadius={handleExpandRadius}
      onRecenter={handleRecenter}
      onRetryGeolocation={handleRecenter}
      onManualSearch={handleManualSearch}
      onSelectStore={handleSelectStore}
      onDismissStoreDetail={handleDismissStoreDetail}
    />
  );
}
