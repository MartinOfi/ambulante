import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { storeProfileService } from "@/features/store-profile/services";
import { logger } from "@/shared/utils/logger";
import { queryKeys } from "@/shared/query/keys";
import type {
  StoreProfile,
  UpdateStoreProfileInput,
} from "@/features/store-profile/schemas/store-profile.schemas";
import { useUpdateStoreProfileMutation } from "./useUpdateStoreProfileMutation";

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

const UPDATE_INPUT: UpdateStoreProfileInput = {
  businessName: "Doña Rosa Updated",
  neighborhood: "Belgrano",
};

const UPDATED_PROFILE: StoreProfile = {
  ...MOCK_PROFILE,
  businessName: "Doña Rosa Updated",
  neighborhood: "Belgrano",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient,
    wrapper: function Wrapper({ children }: { readonly children: React.ReactNode }) {
      return React.createElement(QueryClientProvider, { client: queryClient }, children);
    },
  };
}

describe("useUpdateStoreProfileMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies optimistic update immediately before mutation settles", async () => {
    let resolveUpdate!: (value: StoreProfile) => void;
    const pending = new Promise<StoreProfile>((resolve) => {
      resolveUpdate = resolve;
    });
    vi.mocked(storeProfileService.updateProfile).mockReturnValueOnce(pending);

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(queryKeys.stores.profile(STORE_ID), MOCK_PROFILE);

    const { result } = renderHook(() => useUpdateStoreProfileMutation(STORE_ID), { wrapper });

    act(() => {
      result.current.mutate(UPDATE_INPUT);
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    const optimistic = queryClient.getQueryData<StoreProfile>(queryKeys.stores.profile(STORE_ID));
    expect(optimistic?.businessName).toBe(UPDATE_INPUT.businessName);
    expect(optimistic?.neighborhood).toBe(UPDATE_INPUT.neighborhood);

    resolveUpdate(UPDATED_PROFILE);
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it("invalidates profile cache after successful mutation", async () => {
    vi.mocked(storeProfileService.updateProfile).mockResolvedValueOnce(UPDATED_PROFILE);

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateStoreProfileMutation(STORE_ID), { wrapper });

    await act(async () => {
      result.current.mutate(UPDATE_INPUT);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.stores.profile(STORE_ID),
    });
  });

  it("rolls back cache to previous value when mutation fails", async () => {
    vi.mocked(storeProfileService.updateProfile).mockRejectedValueOnce(new Error("Network error"));

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(queryKeys.stores.profile(STORE_ID), MOCK_PROFILE);

    const { result } = renderHook(() => useUpdateStoreProfileMutation(STORE_ID), { wrapper });

    await act(async () => {
      result.current.mutate(UPDATE_INPUT);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const rolledBack = queryClient.getQueryData<StoreProfile>(queryKeys.stores.profile(STORE_ID));
    expect(rolledBack?.businessName).toBe(MOCK_PROFILE.businessName);
    expect(rolledBack?.neighborhood).toBe(MOCK_PROFILE.neighborhood);
  });

  it("calls logger.error with context when mutation fails", async () => {
    vi.mocked(storeProfileService.updateProfile).mockRejectedValueOnce(new Error("Service error"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateStoreProfileMutation(STORE_ID), { wrapper });

    await act(async () => {
      result.current.mutate(UPDATE_INPUT);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      "useUpdateStoreProfileMutation: update failed",
      expect.objectContaining({ storeId: STORE_ID, error: "Service error" }),
    );
  });
});
