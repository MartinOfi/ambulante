import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNotificationPrefs } from "./useNotificationPrefs";
import { NOTIFICATION_PREFS_STORAGE_KEY } from "@/features/profile/constants";

const STORAGE_KEY = NOTIFICATION_PREFS_STORAGE_KEY;

describe("useNotificationPrefs", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(globalThis, "Notification", {
      value: { permission: "default" },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns default prefs (all false) when nothing is stored", () => {
    const { result } = renderHook(() => useNotificationPrefs());

    expect(result.current.prefs.orderUpdates).toBe(false);
    expect(result.current.prefs.storeArrival).toBe(false);
    expect(result.current.prefs.marketing).toBe(false);
  });

  it("loads persisted prefs from localStorage", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ orderUpdates: true, storeArrival: false, marketing: false }),
    );

    const { result } = renderHook(() => useNotificationPrefs());
    expect(result.current.prefs.orderUpdates).toBe(true);
  });

  it("toggles a pref and persists to localStorage", () => {
    const { result } = renderHook(() => useNotificationPrefs());

    act(() => {
      result.current.togglePref("orderUpdates");
    });

    expect(result.current.prefs.orderUpdates).toBe(true);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(stored.orderUpdates).toBe(true);
  });

  it("does not mutate the previous prefs object", () => {
    const { result } = renderHook(() => useNotificationPrefs());
    const prevPrefs = result.current.prefs;

    act(() => {
      result.current.togglePref("storeArrival");
    });

    expect(prevPrefs.storeArrival).toBe(false);
    expect(result.current.prefs.storeArrival).toBe(true);
    expect(result.current.prefs).not.toBe(prevPrefs);
  });

  it("returns 'default' notification permission when Notification API is available", () => {
    const { result } = renderHook(() => useNotificationPrefs());
    expect(result.current.notificationPermission).toBe("default");
  });

  it("returns 'unsupported' when Notification API is unavailable", () => {
    Object.defineProperty(globalThis, "Notification", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useNotificationPrefs());
    expect(result.current.notificationPermission).toBe("unsupported");
  });

  it("exposes a requestNotificationPermission function", () => {
    const { result } = renderHook(() => useNotificationPrefs());
    expect(typeof result.current.requestNotificationPermission).toBe("function");
  });

  it("falls back to defaults when localStorage contains invalid JSON", () => {
    localStorage.setItem(STORAGE_KEY, "invalid-json{{{");

    const { result } = renderHook(() => useNotificationPrefs());
    expect(result.current.prefs.orderUpdates).toBe(false);
  });

  it("updates notificationPermission to 'granted' after requestNotificationPermission", async () => {
    Object.defineProperty(globalThis, "Notification", {
      value: { permission: "default", requestPermission: vi.fn().mockResolvedValue("granted") },
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useNotificationPrefs());
    expect(result.current.notificationPermission).toBe("default");

    await act(async () => {
      await result.current.requestNotificationPermission();
    });

    expect(result.current.notificationPermission).toBe("granted");
  });
});
