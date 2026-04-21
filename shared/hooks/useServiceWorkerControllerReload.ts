"use client";
import { useEffect } from "react";

export function useServiceWorkerControllerReload(): void {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const swContainer = navigator.serviceWorker;

    const handleControllerChange = () => {
      window.location.reload();
    };

    swContainer.addEventListener("controllerchange", handleControllerChange);

    return () => {
      swContainer.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);
}
