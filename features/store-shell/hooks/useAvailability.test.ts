import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useAvailabilityStore } from "@/features/store-shell/stores/availability.store";
import { useAvailability } from "./useAvailability";

describe("useAvailability", () => {
  beforeEach(() => {
    useAvailabilityStore.setState({ isAvailable: false });
  });

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
