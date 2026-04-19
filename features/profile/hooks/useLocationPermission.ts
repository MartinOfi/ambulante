"use client";

import { useCallback, useEffect, useState } from "react";
import { logger } from "@/shared/utils/logger";
import {
  LOCATION_PERMISSION_STATUS,
  type LocationPermissionStatus,
} from "@/features/profile/constants";

function toLocationStatus(state: string): LocationPermissionStatus {
  if (
    state === LOCATION_PERMISSION_STATUS.GRANTED ||
    state === LOCATION_PERMISSION_STATUS.DENIED ||
    state === LOCATION_PERMISSION_STATUS.PROMPT
  ) {
    return state;
  }
  return LOCATION_PERMISSION_STATUS.UNSUPPORTED;
}

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
      if (permissionStatus) setStatus(toLocationStatus(permissionStatus.state));
    };

    navigator.permissions
      .query({ name: "geolocation" })
      .then((ps) => {
        permissionStatus = ps;
        setStatus(toLocationStatus(ps.state));
        ps.addEventListener("change", handleChange);
      })
      .catch((err: unknown) => {
        logger.error("navigator.permissions.query failed", { err });
        setStatus(LOCATION_PERMISSION_STATUS.UNSUPPORTED);
      });

    return () => {
      permissionStatus?.removeEventListener("change", handleChange);
    };
  }, []);

  const requestPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setStatus(LOCATION_PERMISSION_STATUS.UNSUPPORTED);
      return;
    }

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
