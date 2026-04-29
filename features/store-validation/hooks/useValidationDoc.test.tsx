import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import { createTestQueryClient } from "@/shared/test-utils/render";
import { storeValidationService } from "@/features/store-validation/services";
import { storageService } from "@/shared/services";
import { VALIDATION_DOC_TYPES } from "@/features/store-validation/constants";
import { useValidationDoc } from "./useValidationDoc";

vi.mock("@/features/store-validation/services", () => ({
  storeValidationService: {
    getPendingStores: vi.fn(),
    getStoreById: vi.fn(),
    approveStore: vi.fn(),
    rejectStore: vi.fn(),
    getValidationDoc: vi.fn(),
  },
}));

vi.mock("@/shared/services", () => ({
  storageService: {
    upload: vi.fn(),
    remove: vi.fn(),
    getPublicUrl: vi.fn(),
    getSignedUrl: vi.fn(),
  },
}));

function buildWrapper() {
  const client = createTestQueryClient();
  return function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

describe("useValidationDoc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the signed url + meta when the doc exists", async () => {
    vi.mocked(storeValidationService.getValidationDoc).mockResolvedValue({
      path: "store-x/id_front.jpg",
      mimeType: "image/jpeg",
      filename: "frente.jpg",
    });
    vi.mocked(storageService.getSignedUrl).mockResolvedValue({
      success: true,
      data: "https://signed.example.com/abc",
    });

    const { result } = renderHook(
      () => useValidationDoc("store-x", VALIDATION_DOC_TYPES.ID_FRONT),
      { wrapper: buildWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      url: "https://signed.example.com/abc",
      mimeType: "image/jpeg",
      filename: "frente.jpg",
    });
  });

  it("returns null when the doc is missing", async () => {
    vi.mocked(storeValidationService.getValidationDoc).mockResolvedValue(null);

    const { result } = renderHook(
      () => useValidationDoc("store-x", VALIDATION_DOC_TYPES.BUSINESS_PROOF),
      { wrapper: buildWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(storageService.getSignedUrl).not.toHaveBeenCalled();
  });

  it("surfaces an error when signed url generation fails", async () => {
    vi.mocked(storeValidationService.getValidationDoc).mockResolvedValue({
      path: "store-x/id_front.jpg",
      mimeType: "image/jpeg",
      filename: "frente.jpg",
    });
    vi.mocked(storageService.getSignedUrl).mockResolvedValue({
      success: false,
      error: "Object not found",
    });

    const { result } = renderHook(
      () => useValidationDoc("store-x", VALIDATION_DOC_TYPES.ID_FRONT),
      { wrapper: buildWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Object not found");
  });
});
