import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import { createTestQueryClient } from "@/shared/test-utils/render";
import { VALIDATION_DOC_TYPES } from "@/features/store-validation/constants";
import { useValidationDoc } from "./useValidationDoc";

function buildWrapper() {
  const client = createTestQueryClient();
  return function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

function stubFetch(response: { ok: boolean; body: unknown }) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: response.ok,
      json: () => Promise.resolve(response.body),
    }),
  );
}

describe("useValidationDoc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the signed url + meta when the doc exists", async () => {
    stubFetch({
      ok: true,
      body: {
        data: {
          url: "https://signed.example.com/abc",
          mimeType: "image/jpeg",
          filename: "frente.jpg",
        },
      },
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
    stubFetch({ ok: true, body: { data: null } });

    const { result } = renderHook(
      () => useValidationDoc("store-x", VALIDATION_DOC_TYPES.BUSINESS_PROOF),
      { wrapper: buildWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("surfaces an error when the route returns a non-ok response", async () => {
    stubFetch({ ok: false, body: { error: "Object not found" } });

    const { result } = renderHook(
      () => useValidationDoc("store-x", VALIDATION_DOC_TYPES.ID_FRONT),
      { wrapper: buildWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Object not found");
  });
});
