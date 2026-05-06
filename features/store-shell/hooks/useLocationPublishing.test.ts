import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useLocationPublishing } from "./useLocationPublishing";
import { STORE_LOCATION_REFRESH_MS, STORE_LOCATION_STALE_MS } from "@/shared/constants/geo";

vi.mock("@/features/store-shell/hooks/useAvailability", () => ({
  useAvailability: vi.fn(),
}));

vi.mock("@/shared/hooks/useSession", () => ({
  useSession: vi.fn(),
}));

vi.mock("@/shared/services/stores", () => ({
  storesService: {
    findByOwnerId: vi.fn(),
    updateLocation: vi.fn(),
  },
}));

import { useAvailability } from "@/features/store-shell/hooks/useAvailability";
import { useSession } from "@/shared/hooks/useSession";
import { storesService } from "@/shared/services/stores";

const MOCK_USER_ID = "00000000-0000-4000-8000-000000000002";
const MOCK_STORE_ID = "10000000-0000-4000-8000-000000000001";
const MOCK_COORDS = { lat: -34.6037, lng: -58.3816 };

const MOCK_STORE = {
  id: MOCK_STORE_ID,
  name: "Doña Rosa",
  kind: "food-truck" as const,
  photoUrl: "https://example.com/photo.jpg",
  location: MOCK_COORDS,
  distanceMeters: 320,
  status: "open" as const,
  priceFromArs: 800,
  tagline: "Empanadas salteñas",
  ownerId: MOCK_USER_ID,
};

function mockGeo(lat: number, lng: number, accuracy = 10): void {
  vi.stubGlobal("navigator", {
    ...navigator,
    geolocation: {
      getCurrentPosition: vi.fn((onSuccess: PositionCallback) => {
        onSuccess({
          coords: {
            latitude: lat,
            longitude: lng,
            accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as GeolocationPosition);
      }),
    },
  });
}

function mockGeoError(): void {
  vi.stubGlobal("navigator", {
    ...navigator,
    geolocation: {
      getCurrentPosition: vi.fn((_onSuccess: PositionCallback, onError: PositionErrorCallback) => {
        onError({
          code: 2,
          message: "Position unavailable",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError);
      }),
    },
  });
}

function setAvailable(isAvailable: boolean): void {
  vi.mocked(useAvailability).mockReturnValue({
    isAvailable,
    isPending: false,
    toggle: vi.fn(),
    setAvailable: vi.fn(),
  });
}

function setAuthenticated(userId: string): void {
  vi.mocked(useSession).mockReturnValue({
    status: "authenticated",
    session: {
      accessToken: "tok",
      refreshToken: "ref",
      expiresAt: 9999999999,
      user: {
        id: userId,
        email: "store@test.com",
        role: "store",
        displayName: "Tienda Test",
      },
    },
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  });
}

function setUnauthenticated(): void {
  vi.mocked(useSession).mockReturnValue({
    status: "unauthenticated",
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  });
}

// Flush all pending microtasks (promises) without advancing fake timers
async function flushPromises(): Promise<void> {
  await act(() => vi.advanceTimersByTimeAsync(1));
}

describe("useLocationPublishing", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(storesService.findByOwnerId).mockResolvedValue(MOCK_STORE);
    vi.mocked(storesService.updateLocation).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns idle when store is not available", async () => {
    setAvailable(false);
    setAuthenticated(MOCK_USER_ID);
    mockGeo(MOCK_COORDS.lat, MOCK_COORDS.lng);

    const { result } = renderHook(() => useLocationPublishing());
    await flushPromises();

    expect(result.current.locationStatus).toBe("idle");
    expect(storesService.findByOwnerId).not.toHaveBeenCalled();
  });

  it("returns idle when user is not authenticated", async () => {
    setAvailable(true);
    setUnauthenticated();
    mockGeo(MOCK_COORDS.lat, MOCK_COORDS.lng);

    const { result } = renderHook(() => useLocationPublishing());
    await flushPromises();

    expect(result.current.locationStatus).toBe("idle");
    expect(storesService.findByOwnerId).not.toHaveBeenCalled();
  });

  it("transitions to publishing after first successful location update", async () => {
    setAvailable(true);
    setAuthenticated(MOCK_USER_ID);
    mockGeo(MOCK_COORDS.lat, MOCK_COORDS.lng);

    const { result } = renderHook(() => useLocationPublishing());
    await flushPromises();

    expect(result.current.locationStatus).toBe("publishing");
    expect(storesService.findByOwnerId).toHaveBeenCalledWith(MOCK_USER_ID);
    expect(storesService.updateLocation).toHaveBeenCalledWith(MOCK_STORE_ID, MOCK_COORDS);
  });

  it("transitions to stale after STORE_LOCATION_STALE_MS without a new update", async () => {
    setAvailable(true);
    setAuthenticated(MOCK_USER_ID);
    mockGeo(MOCK_COORDS.lat, MOCK_COORDS.lng);

    // First update succeeds; subsequent ones hang so resetStaleTimer is never called again
    vi.mocked(storesService.updateLocation)
      .mockResolvedValueOnce(undefined)
      .mockReturnValue(new Promise<void>(() => {}));

    const { result } = renderHook(() => useLocationPublishing());
    await flushPromises();
    expect(result.current.locationStatus).toBe("publishing");

    // Interval fires at 45s and 90s but those updates never settle → stale timer fires at 120s
    await act(() => vi.advanceTimersByTimeAsync(STORE_LOCATION_STALE_MS + 1));

    expect(result.current.locationStatus).toBe("stale");
  });

  it("re-publishes on each interval tick and resets the stale timer", async () => {
    setAvailable(true);
    setAuthenticated(MOCK_USER_ID);
    mockGeo(MOCK_COORDS.lat, MOCK_COORDS.lng);

    const { result } = renderHook(() => useLocationPublishing());
    await flushPromises();
    expect(result.current.locationStatus).toBe("publishing");

    const callsBefore = vi.mocked(storesService.updateLocation).mock.calls.length;

    // Advance one full interval (REFRESH_MS = 45s > STALE_MS = 120s is NOT true;
    // REFRESH_MS = 45s, STALE_MS = 120s — so interval fires before stale)
    await act(() => vi.advanceTimersByTimeAsync(STORE_LOCATION_REFRESH_MS + 1));

    expect(vi.mocked(storesService.updateLocation).mock.calls.length).toBeGreaterThan(callsBefore);
    expect(result.current.locationStatus).toBe("publishing");
  });

  it("transitions to error when geolocation fails", async () => {
    setAvailable(true);
    setAuthenticated(MOCK_USER_ID);
    mockGeoError();

    const { result } = renderHook(() => useLocationPublishing());
    await flushPromises();

    expect(result.current.locationStatus).toBe("error");
  });

  it("resets to idle when availability is turned off", async () => {
    setAvailable(true);
    setAuthenticated(MOCK_USER_ID);
    mockGeo(MOCK_COORDS.lat, MOCK_COORDS.lng);

    const { result, rerender } = renderHook(() => useLocationPublishing());
    await flushPromises();
    expect(result.current.locationStatus).toBe("publishing");

    setAvailable(false);
    rerender();

    expect(result.current.locationStatus).toBe("idle");
  });

  it("cleans up interval and stale timer on unmount", async () => {
    setAvailable(true);
    setAuthenticated(MOCK_USER_ID);
    mockGeo(MOCK_COORDS.lat, MOCK_COORDS.lng);

    const { unmount, result } = renderHook(() => useLocationPublishing());
    await flushPromises();

    const callCountAfterPublish = vi.mocked(storesService.updateLocation).mock.calls.length;
    unmount();

    await act(() => vi.advanceTimersByTimeAsync(STORE_LOCATION_REFRESH_MS * 3));
    expect(vi.mocked(storesService.updateLocation).mock.calls.length).toBe(callCountAfterPublish);

    // Stale timer must also be cancelled — status must not flip to "stale"
    await act(() => vi.advanceTimersByTimeAsync(STORE_LOCATION_STALE_MS + 1));
    expect(result.current.locationStatus).toBe("publishing");
  });

  it("transitions to error and clears stale timer when accuracy is too low", async () => {
    setAvailable(true);
    setAuthenticated(MOCK_USER_ID);
    // First call succeeds, second has poor accuracy
    vi.mocked(storesService.updateLocation).mockResolvedValue(undefined);
    const poorAccuracy = 300;
    mockGeo(MOCK_COORDS.lat, MOCK_COORDS.lng, poorAccuracy);

    const { result } = renderHook(() => useLocationPublishing());
    await flushPromises();

    expect(result.current.locationStatus).toBe("error");
    // Stale timer must NOT fire and overwrite the error status
    await act(() => vi.advanceTimersByTimeAsync(STORE_LOCATION_STALE_MS + 1));
    expect(result.current.locationStatus).toBe("error");
  });

  it("transitions to error when findByOwnerId rejects", async () => {
    setAvailable(true);
    setAuthenticated(MOCK_USER_ID);
    mockGeo(MOCK_COORDS.lat, MOCK_COORDS.lng);
    vi.mocked(storesService.findByOwnerId).mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useLocationPublishing());
    await flushPromises();

    expect(result.current.locationStatus).toBe("error");
  });
});
