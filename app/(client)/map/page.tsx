"use client";

import { useState } from "react";
import { MapCanvas } from "./_components/MapCanvas";
import { TopHeader } from "./_components/TopHeader";
import { NearbyBottomSheet } from "./_components/NearbyBottomSheet";
import { RecenterFAB } from "./_components/RecenterFAB";
import { LocationDenied } from "./_components/LocationDenied";
import { useGeolocation } from "./_hooks/useGeolocation";
import { useNearbyStores } from "./_hooks/useNearbyStores";
import { DEFAULT_RADIUS, type RadiusValue } from "@/lib/constants/radius";

export default function MapPage() {
  const [radius, setRadius] = useState<RadiusValue>(DEFAULT_RADIUS);
  const geo = useGeolocation();
  const { stores } = useNearbyStores(radius);

  const hasLocation = geo.status === "granted";

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-surface">
      <MapCanvas stores={stores} hasUserLocation={hasLocation} />

      <TopHeader radius={radius} onRadiusChange={setRadius} />

      <RecenterFAB
        onClick={() => geo.request()}
        disabled={geo.status === "loading"}
      />

      <NearbyBottomSheet
        stores={stores}
        radius={radius}
        onExpandRadius={() => setRadius(5000)}
      />

      {geo.status === "denied" && (
        <LocationDenied
          onRetry={() => geo.request()}
          onManualSearch={() => {
            // v2: open manual zone picker
            console.log("manual search placeholder");
          }}
        />
      )}
    </main>
  );
}
