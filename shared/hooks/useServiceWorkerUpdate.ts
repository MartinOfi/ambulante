"use client";
import { useReducer, useEffect, useRef } from "react";
import {
  SW_MESSAGE_TYPE,
  SW_UPDATE_CHECK_INTERVAL_MS,
  SW_UPDATE_STATUS,
  type SwUpdateStatus,
} from "@/shared/constants/service-worker";

export interface UseServiceWorkerUpdateResult {
  readonly status: SwUpdateStatus;
  readonly applyUpdate: () => void;
  readonly dismiss: () => void;
}

type SwUpdateAction = { type: "UPDATE_FOUND" } | { type: "APPLY" } | { type: "DISMISS" };

function swReducer(state: SwUpdateStatus, action: SwUpdateAction): SwUpdateStatus {
  switch (action.type) {
    case "UPDATE_FOUND":
      return SW_UPDATE_STATUS.AVAILABLE;
    case "APPLY":
      return SW_UPDATE_STATUS.APPLYING;
    case "DISMISS":
      return SW_UPDATE_STATUS.DISMISSED;
    default:
      return state;
  }
}

export function useServiceWorkerUpdate(): UseServiceWorkerUpdateResult {
  const [status, dispatch] = useReducer(swReducer, SW_UPDATE_STATUS.IDLE);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let active = true;
    const swContainer = navigator.serviceWorker;

    const handleUpdateFound = () => {
      const reg = registrationRef.current;
      const installing = reg?.installing;
      if (!installing) return;

      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && swContainer.controller && active) {
          dispatch({ type: "UPDATE_FOUND" });
        }
      });
    };

    swContainer.getRegistration().then((reg) => {
      if (!reg || !active) return;

      registrationRef.current = reg;
      reg.addEventListener("updatefound", handleUpdateFound);

      if (reg.waiting && swContainer.controller) {
        dispatch({ type: "UPDATE_FOUND" });
      }
    });

    const interval = setInterval(() => {
      registrationRef.current?.update().catch(() => undefined);
    }, SW_UPDATE_CHECK_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        registrationRef.current?.update().catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      registrationRef.current?.removeEventListener("updatefound", handleUpdateFound);
    };
  }, []);

  const applyUpdate = () => {
    const waiting = registrationRef.current?.waiting;
    if (!waiting) return;
    dispatch({ type: "APPLY" });
    waiting.postMessage({ type: SW_MESSAGE_TYPE.SKIP_WAITING });
  };

  const dismiss = () => {
    dispatch({ type: "DISMISS" });
  };

  return { status, applyUpdate, dismiss };
}
