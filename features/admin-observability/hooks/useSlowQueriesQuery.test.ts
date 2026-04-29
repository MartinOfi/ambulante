import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createTestQueryClient } from "@/shared/test-utils/render";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import React from "react";
import { useSlowQueriesQuery } from "./useSlowQueriesQuery";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function buildWrapper() {
  const queryClient = createTestQueryClient();
  function Wrapper({ children }: { readonly children: ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

describe("useSlowQueriesQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns slow queries on success", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [{ calls: 10, totalExecTimeMs: 100, meanExecTimeMs: 10, queryText: "select 1" }],
        }),
    });

    const { result } = renderHook(() => useSlowQueriesQuery(), { wrapper: buildWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]).toMatchObject({ calls: 10, queryText: "select 1" });
  });

  it("starts in pending state", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useSlowQueriesQuery(), { wrapper: buildWrapper() });
    expect(result.current.isPending).toBe(true);
  });

  it("transitions to error state when fetch is not ok", async () => {
    mockFetch.mockResolvedValue({ ok: false });

    const { result } = renderHook(() => useSlowQueriesQuery(), { wrapper: buildWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Error obteniendo queries lentas.");
  });

  it("transitions to error state when response data fails schema validation", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            { calls: "not-a-number", totalExecTimeMs: 100, meanExecTimeMs: 10, queryText: "q" },
          ],
        }),
    });

    const { result } = renderHook(() => useSlowQueriesQuery(), { wrapper: buildWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
