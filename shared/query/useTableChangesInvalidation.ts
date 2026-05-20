"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { realtimeService } from "@/shared/services";

interface UseTableChangesInvalidationOptions {
  readonly table: string;
  readonly filter: string | null;
  readonly queryKey: readonly unknown[];
  readonly enabled?: boolean;
}

export function useTableChangesInvalidation({
  table,
  filter,
  queryKey,
  enabled = true,
}: UseTableChangesInvalidationOptions): void {
  const queryClient = useQueryClient();
  const queryKeyRef = useRef(queryKey);
  queryKeyRef.current = queryKey;

  useEffect(() => {
    if (!enabled) return;
    return realtimeService.subscribeToTableChanges(table, filter, () => {
      void queryClient.invalidateQueries({ queryKey: queryKeyRef.current });
    });
  }, [table, filter, queryClient, enabled]);
}
