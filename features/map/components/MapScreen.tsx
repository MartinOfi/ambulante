"use client";

import dynamic from "next/dynamic";
import type { Store } from "@/shared/types/store";
import type { RadiusValue } from "@/shared/constants/radius";
import type { GeoState } from "@/shared/hooks/useGeolocation";
import type { MapCanvasContainerProps } from "./MapCanvas.container";
import { TopHeader } from "./TopHeader";
import { NearbyBottomSheet } from "./NearbyBottomSheet";
import { RecenterFAB } from "./RecenterFAB";
import { LocationDenied } from "./LocationDenied";
import { StoreDetailSheetContainer } from "./StoreDetailSheet";

// maplibre-gl accesses browser APIs (window, WebGL) at module evaluation time;
// dynamic + ssr:false ensures the module is never loaded on the server
const MapCanvasContainer = dynamic<MapCanvasContainerProps>(
  () => import("./MapCanvas.container").then((mod) => ({ default: mod.MapCanvasContainer })),
  { ssr: false },
);

export interface MapScreenProps {
  readonly stores: readonly Store[];
  readonly radius: RadiusValue;
  readonly geo: GeoState;
  readonly isRecentering: boolean;
  readonly selectedStoreId: string | null;
  readonly onRadiusChange: (next: RadiusValue) => void;
  readonly onExpandRadius: () => void;
  readonly onRecenter: () => void;
  readonly onRetryGeolocation: () => void;
  readonly onManualSearch: () => void;
  readonly onSelectStore: (id: string) => void;
  readonly onDismissStoreDetail: () => void;
}

export function MapScreen({
  stores,
  radius,
  geo,
  isRecentering,
  selectedStoreId,
  onRadiusChange,
  onExpandRadius,
  onRecenter,
  onRetryGeolocation,
  onManualSearch,
  onSelectStore,
  onDismissStoreDetail,
}: MapScreenProps) {
  const hasLocation = geo.status === "granted";
  const isDenied = geo.status === "denied";
  const userCoords = geo.status === "granted" ? geo.coords : undefined;

  return (
    <main className="relative h-screen-dvh w-full overflow-hidden bg-surface">
      <MapCanvasContainer
        stores={stores}
        hasUserLocation={hasLocation}
        userCoords={userCoords}
        selectedStoreId={selectedStoreId}
        onSelectStore={onSelectStore}
      />

      <TopHeader radius={radius} onRadiusChange={onRadiusChange} />

      <RecenterFAB onClick={onRecenter} disabled={isRecentering} />

      {selectedStoreId ? (
        <StoreDetailSheetContainer storeId={selectedStoreId} onDismiss={onDismissStoreDetail} />
      ) : (
        <NearbyBottomSheet
          stores={stores}
          radius={radius}
          onExpandRadius={onExpandRadius}
          onSelectStore={onSelectStore}
        />
      )}

      {isDenied && <LocationDenied onRetry={onRetryGeolocation} onManualSearch={onManualSearch} />}
    </main>
  );
}
