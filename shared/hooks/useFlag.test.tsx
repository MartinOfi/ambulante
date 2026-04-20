import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { FLAG_KEYS, type FlagKey } from "@/shared/constants/flags";
import { FlagsProvider } from "@/shared/providers/FlagsProvider";
import { useFlag } from "@/shared/hooks/useFlag";

function makeWrapper(flags: Record<FlagKey, boolean>) {
  return function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return <FlagsProvider flags={flags}>{children}</FlagsProvider>;
  };
}

function makePartialWrapper(flags: Partial<Record<FlagKey, boolean>>) {
  return makeWrapper({ ...defaultFlags(), ...flags });
}

function defaultFlags(): Record<FlagKey, boolean> {
  return {
    [FLAG_KEYS.ENABLE_ORDERS]: false,
    [FLAG_KEYS.ENABLE_REALTIME]: false,
    [FLAG_KEYS.ENABLE_PUSH_NOTIFICATIONS]: false,
    [FLAG_KEYS.ENABLE_STORE_DASHBOARD]: false,
  };
}

describe("useFlag", () => {
  it("returns the flag value from context when flag is true", () => {
    const { result } = renderHook(() => useFlag(FLAG_KEYS.ENABLE_ORDERS), {
      wrapper: makePartialWrapper({ [FLAG_KEYS.ENABLE_ORDERS]: true }),
    });

    expect(result.current).toBe(true);
  });

  it("returns the flag value from context when flag is false", () => {
    const { result } = renderHook(() => useFlag(FLAG_KEYS.ENABLE_PUSH_NOTIFICATIONS), {
      wrapper: makePartialWrapper({ [FLAG_KEYS.ENABLE_PUSH_NOTIFICATIONS]: false }),
    });

    expect(result.current).toBe(false);
  });

  it("returns false when flag defaults to false", () => {
    const { result } = renderHook(() => useFlag(FLAG_KEYS.ENABLE_REALTIME), {
      wrapper: makePartialWrapper({ [FLAG_KEYS.ENABLE_REALTIME]: false }),
    });

    expect(result.current).toBe(false);
  });

  it("throws when used outside FlagsProvider", () => {
    expect(() => {
      renderHook(() => useFlag(FLAG_KEYS.ENABLE_ORDERS));
    }).toThrow("useFlagsContext must be used within FlagsProvider");
  });
});
