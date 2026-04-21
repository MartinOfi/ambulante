"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Coordinates } from "@/shared/types/store";
import {
  GEO_MAX_AGE_MS,
  GEO_TIMEOUT_MS,
  MIN_ACCURACY_METERS,
  POOR_ACCURACY_FACTOR,
} from "@/shared/constants/geo";

export type GeoStatus = "idle" | "loading" | "granted" | "denied" | "error";

export type GeoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "granted"; coords: Coordinates; accuracy: number }
  | { status: "denied" }
  | { status: "error"; message: string };

export type UseGeolocationResult = GeoState & { request: () => void };

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: GEO_TIMEOUT_MS,
  maximumAge: GEO_MAX_AGE_MS,
};

export function useGeolocation(): UseGeolocationResult {
  const [state, setState] = useState<GeoState>({ status: "idle" });
  const watchIdRef = useRef<number | null>(null);

  const startWatch = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setState({ status: "error", message: "Geolocalización no soportada" });
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setState({ status: "loading" });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (position.coords.accuracy > MIN_ACCURACY_METERS * POOR_ACCURACY_FACTOR) {
          setState({
            status: "error",
            message: "Señal GPS imprecisa — probá en un espacio abierto",
          });
          return;
        }
        setState({
          status: "granted",
          coords: { lat: position.coords.latitude, lng: position.coords.longitude },
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setState({ status: "denied" });
          return;
        }
        setState({ status: "error", message: error.message });
      },
      GEO_OPTIONS,
    );
  }, []);

  useEffect(() => {
    startWatch();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
      }
    };
  }, [startWatch]);

  return { ...state, request: startWatch };
}
