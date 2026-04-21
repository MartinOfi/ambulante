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
const WATCH_ID = 42;

function setupGeoMock(): MockGeolocation {
  const mock: MockGeolocation = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn().mockReturnValue(WATCH_ID),
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

  it("initializes to idle before effects run", () => {
    geoMock.watchPosition.mockImplementation(() => WATCH_ID);

    let initialStatus: string | undefined;
    renderHook(() => {
      const geo = useGeolocation();
      if (initialStatus === undefined) initialStatus = geo.status;
      return geo;
    });

    expect(initialStatus).toBe("idle");
  });

  it("starts watchPosition automatically on mount", () => {
    renderHook(() => useGeolocation());
    expect(geoMock.watchPosition).toHaveBeenCalledOnce();
  });

  it("transitions to loading when the watch starts", () => {
    geoMock.watchPosition.mockImplementation(() => WATCH_ID);

    const { result } = renderHook(() => useGeolocation());
    expect(result.current.status).toBe("loading");
  });

  it("transitions to granted with correct coords on success with good accuracy", async () => {
    const position = makePosition(-34.6037, -58.3816, GOOD_ACCURACY);
    geoMock.watchPosition.mockImplementation((onSuccess: GeolocationSuccessCallback) => {
      onSuccess(position);
      return WATCH_ID;
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
    geoMock.watchPosition.mockImplementation((onSuccess: GeolocationSuccessCallback) => {
      onSuccess(position);
      return WATCH_ID;
    });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => expect(result.current.status).toBe("granted"));
  });

  it("transitions to error when accuracy exceeds threshold", async () => {
    const position = makePosition(-34.6037, -58.3816, BAD_ACCURACY);
    geoMock.watchPosition.mockImplementation((onSuccess: GeolocationSuccessCallback) => {
      onSuccess(position);
      return WATCH_ID;
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
    geoMock.watchPosition.mockImplementation(
      (_onSuccess: GeolocationSuccessCallback, onError: GeolocationErrorCallback) => {
        onError(permissionError);
        return WATCH_ID;
      },
    );

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => expect(result.current.status).toBe("denied"));
  });

  it("transitions to error on POSITION_UNAVAILABLE geolocation error", async () => {
    const genericError = makePositionError(2, "Position unavailable");
    geoMock.watchPosition.mockImplementation(
      (_onSuccess: GeolocationSuccessCallback, onError: GeolocationErrorCallback) => {
        onError(genericError);
        return WATCH_ID;
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
    geoMock.watchPosition.mockImplementation(
      (_onSuccess: GeolocationSuccessCallback, onError: GeolocationErrorCallback) => {
        onError(timeoutError);
        return WATCH_ID;
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

  it("updates coords in real-time when the user moves (live tracking)", async () => {
    let capturedOnSuccess: GeolocationSuccessCallback | null = null;
    geoMock.watchPosition.mockImplementation((onSuccess: GeolocationSuccessCallback) => {
      capturedOnSuccess = onSuccess;
      return WATCH_ID;
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      capturedOnSuccess?.(makePosition(-34.6037, -58.3816, GOOD_ACCURACY));
    });

    await waitFor(() =>
      expect(result.current).toMatchObject({
        status: "granted",
        coords: { lat: -34.6037, lng: -58.3816 },
      }),
    );

    act(() => {
      capturedOnSuccess?.(makePosition(-34.61, -58.39, GOOD_ACCURACY));
    });

    await waitFor(() =>
      expect(result.current).toMatchObject({
        status: "granted",
        coords: { lat: -34.61, lng: -58.39 },
      }),
    );
  });

  it("clears the watch on unmount", () => {
    geoMock.watchPosition.mockReturnValue(WATCH_ID);
    const { unmount } = renderHook(() => useGeolocation());

    unmount();

    expect(geoMock.clearWatch).toHaveBeenCalledWith(WATCH_ID);
  });

  it("request() clears the existing watch and starts a new one", async () => {
    const secondWatchId = 99;
    geoMock.watchPosition.mockReturnValueOnce(WATCH_ID).mockReturnValueOnce(secondWatchId);

    const { result } = renderHook(() => useGeolocation());

    expect(geoMock.watchPosition).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.request();
    });

    expect(geoMock.clearWatch).toHaveBeenCalledWith(WATCH_ID);
    expect(geoMock.watchPosition).toHaveBeenCalledTimes(2);
  });

  it("poor accuracy clears the watch and transitions to error (stable state)", async () => {
    let capturedOnSuccess: GeolocationSuccessCallback | null = null;
    geoMock.watchPosition.mockImplementation((onSuccess: GeolocationSuccessCallback) => {
      capturedOnSuccess = onSuccess;
      return WATCH_ID;
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      capturedOnSuccess?.(makePosition(-34.6037, -58.3816, BAD_ACCURACY));
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(geoMock.clearWatch).toHaveBeenCalledWith(WATCH_ID);
  });

  it("transitions to error when coords fail Zod validation", async () => {
    const invalidPosition = makePosition(999, -58.3816, GOOD_ACCURACY);
    geoMock.watchPosition.mockImplementation((onSuccess: GeolocationSuccessCallback) => {
      onSuccess(invalidPosition);
      return WATCH_ID;
    });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() =>
      expect(result.current).toMatchObject({
        status: "error",
        message: expect.stringContaining("Coordenadas inválidas"),
      }),
    );
  });
});
