import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createTestQueryClient } from "@/shared/test-utils/render";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import React from "react";
import { useAuditLogQuery } from "./useAuditLogQuery";
import { ORDER_STATUS } from "@/shared/constants/order";
import { ORDER_ACTOR } from "@/shared/domain/order-state-machine";
import type {
  AuditLogResult,
  FetchAuditLogResult,
} from "@/features/admin-audit-log/types/audit-log.types";

vi.mock("@/features/admin-audit-log/actions/fetch-audit-log", () => ({
  fetchAuditLog: vi.fn(),
}));

import { fetchAuditLog } from "@/features/admin-audit-log/actions/fetch-audit-log";
const fetchAuditLogMock = vi.mocked(fetchAuditLog);

const mockAuditLogResult: AuditLogResult = {
  orderId: "order-test-123",
  entries: [
    {
      eventType: "SISTEMA_RECIBE",
      newStatus: ORDER_STATUS.RECIBIDO,
      actor: ORDER_ACTOR.SISTEMA,
      occurredAt: new Date("2024-01-01T10:00:00Z"),
    },
  ],
};

const mockResult: FetchAuditLogResult = { status: "ok", data: mockAuditLogResult };

function buildWrapper() {
  const queryClient = createTestQueryClient();
  function Wrapper({ children }: { readonly children: ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

describe("useAuditLogQuery", () => {
  beforeEach(() => {
    fetchAuditLogMock.mockResolvedValue(mockResult);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is disabled when orderId is null", () => {
    const { result } = renderHook(() => useAuditLogQuery(null), {
      wrapper: buildWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });

  it("is disabled when orderId is empty string", () => {
    const { result } = renderHook(() => useAuditLogQuery(""), {
      wrapper: buildWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
  });

  it("fetches data when a valid orderId is provided", async () => {
    const { result } = renderHook(() => useAuditLogQuery("order-test-123"), {
      wrapper: buildWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResult);
  });

  it("returns not_found when action returns not_found", async () => {
    fetchAuditLogMock.mockResolvedValue({ status: "not_found" });

    const { result } = renderHook(() => useAuditLogQuery("order-unknown"), {
      wrapper: buildWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ status: "not_found" });
  });

  it("returns error status when action returns error", async () => {
    fetchAuditLogMock.mockResolvedValue({
      status: "error",
      message: "Supabase unavailable",
    });

    const { result } = renderHook(() => useAuditLogQuery("order-error-case"), {
      wrapper: buildWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      status: "error",
      message: "Supabase unavailable",
    });
  });
});
