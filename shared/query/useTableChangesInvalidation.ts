"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { realtimeService } from "@/shared/services";

interface UseTableChangesInvalidationOptions {
  readonly table: string;
  readonly filter: string | null;
  readonly queryKey: readonly unknown[];
}

export function useTableChangesInvalidation({
  table,
  filter,
  queryKey,
}: UseTableChangesInvalidationOptions): void {
  const queryClient = useQueryClient();
  const queryKeyRef = useRef(queryKey);
  queryKeyRef.current = queryKey;

  useEffect(() => {
    return realtimeService.subscribeToTableChanges(table, filter, () => {
      void queryClient.invalidateQueries({ queryKey: queryKeyRef.current });
    });
  }, [table, filter, queryClient]);
}
