import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createTestQueryClient } from "@/shared/test-utils/render";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import React from "react";
import { useKpiDashboardQuery } from "./useKpiDashboardQuery";
import * as kpiDashboardMockModule from "@/features/admin-kpi-dashboard/services/kpi-dashboard.mock";
import type { KpiSnapshot } from "@/features/admin-kpi-dashboard/types/kpi-dashboard.types";

const mockSnapshot: KpiSnapshot = {
  ordersPerDay: 42,
  acceptanceRate: 0.72,
  completionRate: 0.65,
  avgResponseTimeMs: 142_000,
  expirationRate: 0.12,
  activeStoresConcurrent: 8,
  period: "day",
  computedAt: new Date("2026-04-20T10:00:00Z"),
};

function buildWrapper() {
  const queryClient = createTestQueryClient();
  function Wrapper({ children }: { readonly children: ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

describe("useKpiDashboardQuery", () => {
  beforeEach(() => {
    vi.spyOn(kpiDashboardMockModule.kpiDashboardService, "fetchKpiSnapshot").mockResolvedValue(
      mockSnapshot,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns data after successful fetch", async () => {
    const { result } = renderHook(() => useKpiDashboardQuery(), {
      wrapper: buildWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockSnapshot);
  });

  it("starts in loading state", () => {
    const { result } = renderHook(() => useKpiDashboardQuery(), {
      wrapper: buildWrapper(),
    });

    expect(result.current.isPending).toBe(true);
  });

  it("transitions to error state when service throws", async () => {
    vi.spyOn(kpiDashboardMockModule.kpiDashboardService, "fetchKpiSnapshot").mockRejectedValue(
      new Error("service unavailable"),
    );

    const { result } = renderHook(() => useKpiDashboardQuery(), {
      wrapper: buildWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
