"use client";

import { useState } from "react";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { toast } from "sonner";

import { logger } from "@/shared/utils/logger";
import { extractErrorMessage } from "@/shared/utils/errorMessage";

const STALE_TIME_MS = 30_000;
const GC_TIME_MS = 5 * 60_000;
const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_BASE_MS = 1_000;
const RETRY_DELAY_CAP_MS = 30_000;
const NETWORK_MODE = "offlineFirst";

function hasNumericStatus(value: unknown): value is { status: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    // `in` guard confirms the property exists but TypeScript cannot narrow its type without a cast
    typeof (value as Record<string, unknown>).status === "number"
  );
}

export function isClientError(error: unknown): boolean {
  if (!hasNumericStatus(error)) return false;
  return error.status >= 400 && error.status < 500;
}

export function computeRetryDelay(attemptIndex: number): number {
  return Math.min(RETRY_DELAY_BASE_MS * 2 ** attemptIndex, RETRY_DELAY_CAP_MS);
}

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isClientError(error)) return false;
  return failureCount < MAX_RETRY_COUNT;
}

interface QueryProviderProps {
  readonly children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError(error, query) {
            logger.error("Query failed after all retries", {
              queryKey: query.queryKey,
              error,
            });
            const message = extractErrorMessage(error);
            if (message) toast.error(message);
          },
        }),
        defaultOptions: {
          mutations: {
            onError(error) {
              const message = extractErrorMessage(error, "mutation");
              if (message) toast.error(message);
            },
          },
          queries: {
            staleTime: STALE_TIME_MS,
            gcTime: GC_TIME_MS,
            retry: shouldRetry,
            retryDelay: computeRetryDelay,
            // PWA windows are frequently backgrounded on mobile; focus events are noisy
            // and offlineFirst already handles reconnection refetches.
            networkMode: NETWORK_MODE,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
