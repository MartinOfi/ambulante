"use client";

import { useCallback, useEffect, useState } from "react";
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

export function useGeolocation(): UseGeolocationResult {
  const [state, setState] = useState<GeoState>({ status: "idle" });

  const request = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setState({ status: "error", message: "Geolocalización no soportada" });
      return;
    }

    setState({ status: "loading" });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (pos.coords.accuracy > MIN_ACCURACY_METERS * POOR_ACCURACY_FACTOR) {
          setState({
            status: "error",
            message: "Señal GPS imprecisa — probá en un espacio abierto",
          });
          return;
        }
        setState({
          status: "granted",
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState({ status: "denied" });
          return;
        }
        setState({ status: "error", message: err.message });
      },
      {
        enableHighAccuracy: true,
        timeout: GEO_TIMEOUT_MS,
        maximumAge: GEO_MAX_AGE_MS,
      },
    );
  }, []);

  useEffect(() => {
    request();
  }, [request]);

  return { ...state, request };
}
