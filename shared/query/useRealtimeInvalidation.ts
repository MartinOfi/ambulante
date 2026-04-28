"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { realtimeService } from "@/shared/services";

interface UseRealtimeInvalidationOptions {
  readonly channel: string;
  readonly queryKey: readonly unknown[];
}

export function useRealtimeInvalidation({
  channel,
  queryKey,
}: UseRealtimeInvalidationOptions): void {
  const queryClient = useQueryClient();
  const queryKeyRef = useRef(queryKey);
  queryKeyRef.current = queryKey;

  useEffect(() => {
    return realtimeService.subscribe(channel, () => {
      void queryClient.invalidateQueries({ queryKey: queryKeyRef.current });
    });
  }, [channel, queryClient]);
}
