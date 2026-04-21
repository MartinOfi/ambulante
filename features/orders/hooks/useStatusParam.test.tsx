import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";

import { useStatusParam } from "./useStatusParam";
import { ORDER_STATUS } from "@/shared/constants/order";

function makeWrapper(searchParams: string) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <NuqsTestingAdapter searchParams={searchParams}>{children}</NuqsTestingAdapter>;
  };
}

describe("useStatusParam", () => {
  it("returns null by default when no query param is set", () => {
    const { result } = renderHook(() => useStatusParam(), {
      wrapper: makeWrapper(""),
    });

    const [status] = result.current;
    expect(status).toBeNull();
  });

  it("returns the status from the URL when ?status= is present", () => {
    const { result } = renderHook(() => useStatusParam(), {
      wrapper: makeWrapper(`status=${ORDER_STATUS.ACEPTADO}`),
    });

    const [status] = result.current;
    expect(status).toBe(ORDER_STATUS.ACEPTADO);
  });

  it("returns null for an invalid status value", () => {
    const { result } = renderHook(() => useStatusParam(), {
      wrapper: makeWrapper("status=INVALID_STATUS"),
    });

    const [status] = result.current;
    expect(status).toBeNull();
  });

  it("updates the URL status param when setter is called", async () => {
    const { result } = renderHook(() => useStatusParam(), {
      wrapper: makeWrapper(""),
    });

    await act(async () => {
      const [, setStatus] = result.current;
      setStatus(ORDER_STATUS.FINALIZADO);
    });

    const [status] = result.current;
    expect(status).toBe(ORDER_STATUS.FINALIZADO);
  });
});
