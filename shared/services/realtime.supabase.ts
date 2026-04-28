import { createBrowserClient } from "@supabase/ssr";

import type {
  RealtimeHandler,
  RealtimeService,
  RealtimeStatus,
  RealtimeStatusHandler,
} from "./realtime.types";

export function createRealtimeClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export const supabaseRealtimeService: RealtimeService = {
  subscribe<T = unknown>(_channel: string, _handler: RealtimeHandler<T>): () => void {
    throw new Error("TODO — implementar en B5");
  },
  unsubscribe(_channel: string): void {
    throw new Error("TODO — implementar en B5");
  },
  status(): RealtimeStatus {
    throw new Error("TODO — implementar en B5");
  },
  onStatusChange(_handler: RealtimeStatusHandler): () => void {
    throw new Error("TODO — implementar en B5");
  },
  reconnect(): void {
    throw new Error("TODO — implementar en B5");
  },
  destroy(): void {
    throw new Error("TODO — implementar en B5");
  },
};
