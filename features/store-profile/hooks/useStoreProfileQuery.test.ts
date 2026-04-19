import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { storeProfileService } from "@/features/store-profile/services";
import { logger } from "@/shared/utils/logger";
import type { StoreProfile } from "@/features/store-profile/schemas/store-profile.schemas";
import { useStoreProfileQuery } from "./useStoreProfileQuery";

vi.mock("@/features/store-profile/services", () => ({
  storeProfileService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
  MOCK_STORE_ID: "dona-rosa",
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const STORE_ID = "dona-rosa";

const MOCK_PROFILE: StoreProfile = {
  storeId: STORE_ID,
  businessName: "Doña Rosa Empanadas",
  kind: "food-truck",
  neighborhood: "Palermo",
  coverageNotes: "Zona Palermo SoHo y Hollywood",
  days: ["lunes", "martes", "miercoles", "jueves", "viernes"],
  openTime: "10:00",
  closeTime: "20:00",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useStoreProfileQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not fetch when storeId is null (enabled = false)", () => {
    const wrapper = createWrapper();

    const { result } = renderHook(() => useStoreProfileQuery(null), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
    expect(storeProfileService.getProfile).not.toHaveBeenCalled();
  });

  it("fetches profile when storeId is provided and returns service result", async () => {
    vi.mocked(storeProfileService.getProfile).mockResolvedValueOnce(MOCK_PROFILE);
    const wrapper = createWrapper();

    const { result } = renderHook(() => useStoreProfileQuery(STORE_ID), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(MOCK_PROFILE);
    expect(storeProfileService.getProfile).toHaveBeenCalledOnce();
    expect(storeProfileService.getProfile).toHaveBeenCalledWith(STORE_ID);
  });

  it("returns isError true and logs error when service rejects", async () => {
    vi.mocked(storeProfileService.getProfile).mockRejectedValueOnce(new Error("Not found"));
    const wrapper = createWrapper();

    const { result } = renderHook(() => useStoreProfileQuery(STORE_ID), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      "useStoreProfileQuery: fetch failed",
      expect.objectContaining({ storeId: STORE_ID, error: "Not found" }),
    );
  });
});
