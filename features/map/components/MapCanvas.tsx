"use client";

import type { Store } from "@/shared/types/store";
import { StorePin } from "./StorePin";
import { UserLocationPin } from "./UserLocationPin";

interface MapCanvasProps {
  readonly stores: readonly Store[];
  readonly hasUserLocation: boolean;
}

/**
 * V1 placeholder — stylized static map. Swap for react-map-gl in v2.
 * Pin positions are faked based on store index to convey spatial feel.
 */
const PIN_POSITIONS = [
  { top: "32%", left: "38%" },
  { top: "44%", left: "62%" },
  { top: "28%", left: "70%" },
  { top: "52%", left: "30%" },
];

export function MapCanvas({ stores, hasUserLocation }: MapCanvasProps) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base map placeholder — warm cream with street grid */}
      <div className="absolute inset-0 bg-[hsl(var(--surface))]">
        <svg
          className="h-full w-full opacity-60"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <pattern
              id="streets"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <rect width="80" height="80" fill="hsl(var(--surface))" />
              <path
                d="M0 40 H80 M40 0 V80"
                stroke="hsl(var(--border))"
                strokeWidth="8"
              />
              <path
                d="M0 0 H80 M0 80 H80 M0 0 V80 M80 0 V80"
                stroke="hsl(var(--border))"
                strokeWidth="2"
              />
            </pattern>
            <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="transparent" />
              <stop
                offset="100%"
                stopColor="hsl(var(--brand-primary))"
                stopOpacity="0.06"
              />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#streets)" />
          <rect width="100%" height="100%" fill="url(#vignette)" />
        </svg>
      </div>

      {/* Store pins */}
      {stores.map((store, i) => (
        <StorePin
          key={store.id}
          kind={store.kind}
          top={PIN_POSITIONS[i % PIN_POSITIONS.length].top}
          left={PIN_POSITIONS[i % PIN_POSITIONS.length].left}
          label={store.name}
        />
      ))}

      {/* User location */}
      {hasUserLocation && <UserLocationPin />}
    </div>
  );
}
