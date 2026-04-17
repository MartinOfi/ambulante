"use client";

import type { Store } from "@/shared/types/store";
import type { RadiusValue } from "@/shared/constants/radius";
import type { GeoState } from "@/shared/hooks/useGeolocation";
import { MapCanvas } from "./MapCanvas";
import { TopHeader } from "./TopHeader";
import { NearbyBottomSheet } from "./NearbyBottomSheet";
import { RecenterFAB } from "./RecenterFAB";
import { LocationDenied } from "./LocationDenied";

export interface MapScreenProps {
  readonly stores: readonly Store[];
  readonly radius: RadiusValue;
  readonly geo: GeoState;
  readonly isRecentering: boolean;
  readonly onRadiusChange: (next: RadiusValue) => void;
  readonly onExpandRadius: () => void;
  readonly onRecenter: () => void;
  readonly onRetryGeolocation: () => void;
  readonly onManualSearch: () => void;
}

export function MapScreen({
  stores,
  radius,
  geo,
  isRecentering,
  onRadiusChange,
  onExpandRadius,
  onRecenter,
  onRetryGeolocation,
  onManualSearch,
}: MapScreenProps) {
  const hasLocation = geo.status === "granted";
  const isDenied = geo.status === "denied";

  return (
    <main className="relative h-screen-dvh w-full overflow-hidden bg-surface">
      <MapCanvas stores={stores} hasUserLocation={hasLocation} />

      <TopHeader radius={radius} onRadiusChange={onRadiusChange} />

      <RecenterFAB onClick={onRecenter} disabled={isRecentering} />

      <NearbyBottomSheet stores={stores} radius={radius} onExpandRadius={onExpandRadius} />

      {isDenied && <LocationDenied onRetry={onRetryGeolocation} onManualSearch={onManualSearch} />}
    </main>
  );
}
