import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useLocationPermission } from "./useLocationPermission";

type MockPermissionStatus = {
  state: PermissionState;
  onchange: ((this: PermissionStatus, ev: Event) => unknown) | null;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
};

function makeMockPermission(state: PermissionState): MockPermissionStatus {
  return {
    state,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

describe("useLocationPermission", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      value: { permissions: { query: vi.fn() } },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 'unsupported' when permissions API is unavailable", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {},
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useLocationPermission());
    await waitFor(() => expect(result.current.status).toBe("unsupported"));
  });

  it("returns 'granted' when browser permission is granted", async () => {
    const mockStatus = makeMockPermission("granted");
    vi.spyOn(navigator.permissions, "query").mockResolvedValue(
      mockStatus as unknown as PermissionStatus,
    );

    const { result } = renderHook(() => useLocationPermission());
    await waitFor(() => expect(result.current.status).toBe("granted"));
  });

  it("returns 'denied' when browser permission is denied", async () => {
    const mockStatus = makeMockPermission("denied");
    vi.spyOn(navigator.permissions, "query").mockResolvedValue(
      mockStatus as unknown as PermissionStatus,
    );

    const { result } = renderHook(() => useLocationPermission());
    await waitFor(() => expect(result.current.status).toBe("denied"));
  });

  it("returns 'prompt' when browser permission is prompt", async () => {
    const mockStatus = makeMockPermission("prompt");
    vi.spyOn(navigator.permissions, "query").mockResolvedValue(
      mockStatus as unknown as PermissionStatus,
    );

    const { result } = renderHook(() => useLocationPermission());
    await waitFor(() => expect(result.current.status).toBe("prompt"));
  });

  it("reacts to permission changes via change event", async () => {
    const mockStatus = makeMockPermission("prompt");
    let changeListener: EventListenerOrEventListenerObject | null = null;

    mockStatus.addEventListener = vi.fn(
      (event: string, listener: EventListenerOrEventListenerObject) => {
        if (event === "change") changeListener = listener;
      },
    );

    vi.spyOn(navigator.permissions, "query").mockResolvedValue(
      mockStatus as unknown as PermissionStatus,
    );

    const { result } = renderHook(() => useLocationPermission());
    await waitFor(() => expect(result.current.status).toBe("prompt"));

    act(() => {
      mockStatus.state = "granted";
      if (typeof changeListener === "function") changeListener(new Event("change"));
    });

    await waitFor(() => expect(result.current.status).toBe("granted"));
  });

  it("removes change listener on unmount", async () => {
    const mockStatus = makeMockPermission("granted");
    vi.spyOn(navigator.permissions, "query").mockResolvedValue(
      mockStatus as unknown as PermissionStatus,
    );

    const { unmount } = renderHook(() => useLocationPermission());
    await waitFor(() => expect(mockStatus.addEventListener).toHaveBeenCalled());

    unmount();
    expect(mockStatus.removeEventListener).toHaveBeenCalledOnce();
  });

  it("exposes a requestPermission function", async () => {
    const mockStatus = makeMockPermission("prompt");
    vi.spyOn(navigator.permissions, "query").mockResolvedValue(
      mockStatus as unknown as PermissionStatus,
    );

    const { result } = renderHook(() => useLocationPermission());
    await waitFor(() => expect(result.current.status).toBe("prompt"));

    expect(typeof result.current.requestPermission).toBe("function");
  });

  it("sets status to 'granted' when requestPermission succeeds", async () => {
    const mockStatus = makeMockPermission("prompt");
    vi.spyOn(navigator.permissions, "query").mockResolvedValue(
      mockStatus as unknown as PermissionStatus,
    );
    Object.defineProperty(globalThis, "navigator", {
      value: {
        permissions: navigator.permissions,
        geolocation: {
          getCurrentPosition: vi.fn((onSuccess: PositionCallback) => {
            onSuccess({ coords: {}, timestamp: 0 } as GeolocationPosition);
          }),
        },
      },
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useLocationPermission());
    await waitFor(() => expect(result.current.status).toBe("prompt"));

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(result.current.status).toBe("granted");
  });

  it("sets status to 'denied' when requestPermission is rejected", async () => {
    const mockStatus = makeMockPermission("prompt");
    vi.spyOn(navigator.permissions, "query").mockResolvedValue(
      mockStatus as unknown as PermissionStatus,
    );
    Object.defineProperty(globalThis, "navigator", {
      value: {
        permissions: navigator.permissions,
        geolocation: {
          getCurrentPosition: vi.fn(
            (_onSuccess: PositionCallback, onError: PositionErrorCallback) => {
              onError({ code: 1, message: "denied" } as GeolocationPositionError);
            },
          ),
        },
      },
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useLocationPermission());
    await waitFor(() => expect(result.current.status).toBe("prompt"));

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(result.current.status).toBe("denied");
  });
});
