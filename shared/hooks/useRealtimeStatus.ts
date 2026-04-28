"use client";

import { useEffect, useState } from "react";
import { realtimeService } from "@/shared/services";
import type { RealtimeService, RealtimeStatus } from "@/shared/services/realtime.types";

export function useRealtimeStatus(service: RealtimeService = realtimeService): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>(() => service.status());

  useEffect(() => {
    setStatus((prev) => {
      const current = service.status();
      return current !== prev ? current : prev;
    });
    return service.onStatusChange(setStatus);
  }, [service]);

  return status;
}
