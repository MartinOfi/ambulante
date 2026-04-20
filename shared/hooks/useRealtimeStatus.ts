"use client";

import { useEffect, useState } from "react";
import { realtimeService } from "@/shared/services/realtime";
import type { RealtimeService, RealtimeStatus } from "@/shared/services/realtime";

export function useRealtimeStatus(service: RealtimeService = realtimeService): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>(() => service.status());

  useEffect(() => {
    setStatus(service.status());
    return service.onStatusChange(setStatus);
  }, [service]);

  return status;
}
