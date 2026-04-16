import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useAvailability } from "./useAvailability";

describe("useAvailability", () => {
  it("starts as unavailable", () => {
    const { result } = renderHook(() => useAvailability());
    expect(result.current.isAvailable).toBe(false);
  });

  it("toggle flips from false to true", () => {
    const { result } = renderHook(() => useAvailability());
    act(() => result.current.toggle());
    expect(result.current.isAvailable).toBe(true);
  });

  it("toggle flips back to false", () => {
    const { result } = renderHook(() => useAvailability());
    act(() => result.current.toggle());
    act(() => result.current.toggle());
    expect(result.current.isAvailable).toBe(false);
  });

  it("setAvailable(true) sets to true", () => {
    const { result } = renderHook(() => useAvailability());
    act(() => result.current.setAvailable(true));
    expect(result.current.isAvailable).toBe(true);
  });

  it("setAvailable(false) sets to false after being true", () => {
    const { result } = renderHook(() => useAvailability());
    act(() => result.current.setAvailable(true));
    act(() => result.current.setAvailable(false));
    expect(result.current.isAvailable).toBe(false);
  });
});
