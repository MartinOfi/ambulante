import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import { logger } from "@/shared/utils/logger";
import { updateProfile } from "@/features/profile/actions";
import type { User } from "@/shared/schemas/user";
import { useUpdateProfileMutation } from "./useUpdateProfileMutation";

vi.mock("@/features/profile/actions", () => ({
  updateProfile: vi.fn(),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const updateProfileMock = vi.mocked(updateProfile);

const MOCK_USER: User = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "cliente@example.com",
  role: "client",
  displayName: "Nuevo",
  avatarUrl: undefined,
  suspended: false,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return {
    queryClient,
    wrapper: function Wrapper({ children }: { readonly children: React.ReactNode }) {
      return React.createElement(QueryClientProvider, { client: queryClient }, children);
    },
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("useUpdateProfileMutation", () => {
  it("happy path: invoca updateProfile y retorna el user", async () => {
    updateProfileMock.mockResolvedValueOnce({ ok: true, user: MOCK_USER });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateProfileMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ displayName: "Nuevo" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateProfileMock).toHaveBeenCalledWith({ displayName: "Nuevo" });
    expect(result.current.data).toEqual(MOCK_USER);
  });

  it("invalida ['user', 'me'] al éxito", async () => {
    updateProfileMock.mockResolvedValueOnce({ ok: true, user: MOCK_USER });

    const { queryClient, wrapper } = createWrapper();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateProfileMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ displayName: "Nuevo" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["user", "me"] });
  });

  it("throws cuando updateProfile retorna ok:false", async () => {
    updateProfileMock.mockResolvedValueOnce({
      ok: false,
      errorCode: "VALIDATION_ERROR",
      message: "El nombre no puede estar vacío",
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateProfileMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ displayName: "" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(logger.error).toHaveBeenCalled();
  });
});
