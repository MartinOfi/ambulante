"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LOCATION_PERMISSION_STATUS,
  type LocationPermissionStatus,
} from "@/features/profile/constants";

export type UseLocationPermissionResult = {
  status: LocationPermissionStatus;
  requestPermission: () => Promise<void>;
};

export function useLocationPermission(): UseLocationPermissionResult {
  const [status, setStatus] = useState<LocationPermissionStatus>(LOCATION_PERMISSION_STATUS.PROMPT);

  useEffect(() => {
    if (!navigator.permissions) {
      setStatus(LOCATION_PERMISSION_STATUS.UNSUPPORTED);
      return;
    }

    let permissionStatus: PermissionStatus | null = null;

    const handleChange = () => {
      if (permissionStatus) setStatus(permissionStatus.state as LocationPermissionStatus);
    };

    navigator.permissions.query({ name: "geolocation" }).then((ps) => {
      permissionStatus = ps;
      setStatus(ps.state as LocationPermissionStatus);
      ps.addEventListener("change", handleChange);
    });

    return () => {
      permissionStatus?.removeEventListener("change", handleChange);
    };
  }, []);

  const requestPermission = useCallback(async () => {
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setStatus(LOCATION_PERMISSION_STATUS.GRANTED);
          resolve();
        },
        () => {
          setStatus(LOCATION_PERMISSION_STATUS.DENIED);
          resolve();
        },
      );
    });
  }, []);

  return { status, requestPermission };
}
