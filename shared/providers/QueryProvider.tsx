"use client";

import { useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const STALE_TIME_MS = 30_000;
const GC_TIME_MS = 5 * 60_000;
const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_BASE_MS = 1_000;
const RETRY_DELAY_CAP_MS = 30_000;

export function isClientError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return false;
  }
  const status = (error as { status: unknown }).status;
  return typeof status === "number" && status >= 400 && status < 500;
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
        defaultOptions: {
          queries: {
            staleTime: STALE_TIME_MS,
            gcTime: GC_TIME_MS,
            retry: shouldRetry,
            retryDelay: computeRetryDelay,
            networkMode: "offlineFirst",
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
