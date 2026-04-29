"use client";

import { useSlowQueriesQuery } from "@/features/admin-observability/hooks/useSlowQueriesQuery";
import { SlowQueriesPanel } from "./SlowQueriesPanel";

export function SlowQueriesPanelContainer() {
  const { data, isPending, error } = useSlowQueriesQuery();

  return (
    <SlowQueriesPanel
      queries={data ?? []}
      isLoading={isPending}
      error={error ? error.message : null}
    />
  );
}
