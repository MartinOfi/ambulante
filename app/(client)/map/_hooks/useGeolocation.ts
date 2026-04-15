"use client";

import { useCallback, useEffect, useState } from "react";
import type { Coordinates } from "../_types/store";

export type GeoStatus = "idle" | "loading" | "granted" | "denied" | "error";

export type GeoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "granted"; coords: Coordinates; accuracy: number }
  | { status: "denied" }
  | { status: "error"; message: string };

const MIN_ACCURACY_METERS = 50;

export function useGeolocation(): GeoState & { request: () => void } {
  const [state, setState] = useState<GeoState>({ status: "idle" });

  const request = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setState({ status: "error", message: "Geolocalización no soportada" });
      return;
    }

    setState({ status: "loading" });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (pos.coords.accuracy > MIN_ACCURACY_METERS * 4) {
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
        } else {
          setState({ status: "error", message: err.message });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, []);

  useEffect(() => {
    request();
  }, [request]);

  return { ...state, request };
}
