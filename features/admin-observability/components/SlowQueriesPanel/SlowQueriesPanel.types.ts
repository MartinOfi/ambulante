import type { SlowQuery } from "@/shared/types/observability";

export interface SlowQueriesPanelProps {
  readonly queries: SlowQuery[];
  readonly isLoading: boolean;
  readonly error: string | null;
}
