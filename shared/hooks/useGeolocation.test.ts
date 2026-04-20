import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MIN_ACCURACY_METERS, POOR_ACCURACY_FACTOR } from "@/shared/constants/geo";
import { useGeolocation } from "./useGeolocation";

type GeolocationSuccessCallback = (pos: GeolocationPosition) => void;
type GeolocationErrorCallback = (err: GeolocationPositionError) => void;

interface MockGeolocation {
  readonly getCurrentPosition: ReturnType<typeof vi.fn>;
  readonly watchPosition: ReturnType<typeof vi.fn>;
  readonly clearWatch: ReturnType<typeof vi.fn>;
}

function makePosition(lat: number, lng: number, accuracy: number): GeolocationPosition {
  return {
    coords: {
      latitude: lat,
      longitude: lng,
      accuracy,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    } as GeolocationCoordinates,
    timestamp: Date.now(),
  } as GeolocationPosition;
}

function makePositionError(code: number, message: string): GeolocationPositionError {
  return {
    code,
    message,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as GeolocationPositionError;
}

const GOOD_ACCURACY = MIN_ACCURACY_METERS;
const BOUNDARY_ACCURACY = MIN_ACCURACY_METERS * POOR_ACCURACY_FACTOR;
const BAD_ACCURACY = MIN_ACCURACY_METERS * POOR_ACCURACY_FACTOR + 1;

function setupGeoMock(): MockGeolocation {
  const mock: MockGeolocation = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  };
  vi.stubGlobal("navigator", { geolocation: mock });
  return mock;
}

describe("useGeolocation", () => {
  let geoMock: MockGeolocation;

  beforeEach(() => {
    geoMock = setupGeoMock();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("initializes to idle status before request fires", () => {
    geoMock.getCurrentPosition.mockImplementation(() => {
      // never resolves — inspect initial state synchronously before useEffect runs
    });
    const { result } = renderHook(() => useGeolocation());
    // useEffect fires async; the very first render is idle
    expect(["idle", "loading"]).toContain(result.current.status);
  });

  it("fires request() automatically on mount", () => {
    renderHook(() => useGeolocation());
    expect(geoMock.getCurrentPosition).toHaveBeenCalledOnce();
  });

  it("transitions to loading when request() is called", () => {
    geoMock.getCurrentPosition.mockImplementation(() => {
      // never resolves — stays loading
    });

    const { result } = renderHook(() => useGeolocation());
    expect(result.current.status).toBe("loading");
  });

  it("transitions to granted with correct coords on success with good accuracy", async () => {
    const position = makePosition(-34.6037, -58.3816, GOOD_ACCURACY);
    geoMock.getCurrentPosition.mockImplementation((onSuccess: GeolocationSuccessCallback) => {
      onSuccess(position);
    });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() =>
      expect(result.current).toMatchObject({
        status: "granted",
        coords: { lat: -34.6037, lng: -58.3816 },
        accuracy: GOOD_ACCURACY,
      }),
    );
  });

  it("treats accuracy equal to threshold as granted (boundary)", async () => {
    const position = makePosition(-34.6037, -58.3816, BOUNDARY_ACCURACY);
    geoMock.getCurrentPosition.mockImplementation((onSuccess: GeolocationSuccessCallback) => {
      onSuccess(position);
    });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => expect(result.current.status).toBe("granted"));
  });

  it("transitions to error when accuracy exceeds threshold", async () => {
    const position = makePosition(-34.6037, -58.3816, BAD_ACCURACY);
    geoMock.getCurrentPosition.mockImplementation((onSuccess: GeolocationSuccessCallback) => {
      onSuccess(position);
    });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() =>
      expect(result.current).toMatchObject({
        status: "error",
        message: expect.stringContaining("imprecisa"),
      }),
    );
  });

  it("transitions to denied when PERMISSION_DENIED error occurs", async () => {
    const permissionError = makePositionError(1, "User denied Geolocation");
    geoMock.getCurrentPosition.mockImplementation(
      (_onSuccess: GeolocationSuccessCallback, onError: GeolocationErrorCallback) => {
        onError(permissionError);
      },
    );

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => expect(result.current.status).toBe("denied"));
  });

  it("transitions to error on POSITION_UNAVAILABLE geolocation error", async () => {
    const genericError = makePositionError(2, "Position unavailable");
    geoMock.getCurrentPosition.mockImplementation(
      (_onSuccess: GeolocationSuccessCallback, onError: GeolocationErrorCallback) => {
        onError(genericError);
      },
    );

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() =>
      expect(result.current).toMatchObject({
        status: "error",
        message: "Position unavailable",
      }),
    );
  });

  it("transitions to error on TIMEOUT geolocation error", async () => {
    const timeoutError = makePositionError(3, "Timeout expired");
    geoMock.getCurrentPosition.mockImplementation(
      (_onSuccess: GeolocationSuccessCallback, onError: GeolocationErrorCallback) => {
        onError(timeoutError);
      },
    );

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() =>
      expect(result.current).toMatchObject({
        status: "error",
        message: "Timeout expired",
      }),
    );
  });

  it("sets error when geolocation is not supported", async () => {
    vi.stubGlobal("navigator", {});

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() =>
      expect(result.current).toMatchObject({
        status: "error",
        message: expect.stringContaining("soportada"),
      }),
    );
  });

  it("exposes a request function on the result", () => {
    const { result } = renderHook(() => useGeolocation());
    expect(typeof result.current.request).toBe("function");
  });

  it("re-requests position when request() is called manually", async () => {
    const position = makePosition(-34.6037, -58.3816, GOOD_ACCURACY);
    geoMock.getCurrentPosition.mockImplementation((onSuccess: GeolocationSuccessCallback) => {
      onSuccess(position);
    });

    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current.status).toBe("granted"));

    act(() => {
      result.current.request();
    });

    expect(geoMock.getCurrentPosition).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(result.current.status).toBe("granted"));
  });
});
