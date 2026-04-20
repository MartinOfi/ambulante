import { describe, expect, it, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import type { UseQueryResult } from "@tanstack/react-query";
import { DEFAULT_RADIUS } from "@/shared/constants/radius";
import { MAX_EXPAND_RADIUS } from "@/features/map/constants";
import { renderWithProviders } from "@/shared/test-utils";
import { createStore } from "@/shared/test-utils";
import type { Store } from "@/shared/types/store";
import type { UseGeolocationResult } from "@/shared/hooks/useGeolocation";
import { useGeolocation } from "@/shared/hooks/useGeolocation";
import { useRadiusParam } from "@/features/map/hooks/useRadiusParam";
import { useStoresNearbyQuery } from "@/features/map/hooks/useStoresNearbyQuery";
import type { MapScreenProps } from "./MapScreen";
import { MapScreen } from "./MapScreen";
import { MapScreenContainer } from "./MapScreen.container";

vi.mock("@/shared/hooks/useGeolocation");
vi.mock("@/features/map/hooks/useRadiusParam");
vi.mock("@/features/map/hooks/useStoresNearbyQuery");
vi.mock("./MapScreen");

function makeGeo(overrides: Partial<UseGeolocationResult> = {}): UseGeolocationResult {
  return { status: "idle", request: vi.fn(), ...overrides } as UseGeolocationResult;
}

function makeQueryResult(stores: Store[]): Partial<UseQueryResult<Store[]>> {
  return { data: stores };
}

describe("MapScreenContainer", () => {
  const mockSetRadius = vi.fn();

  beforeEach(() => {
    vi.mocked(useGeolocation).mockReturnValue(makeGeo());
    vi.mocked(useRadiusParam).mockReturnValue([DEFAULT_RADIUS, mockSetRadius]);
    vi.mocked(useStoresNearbyQuery).mockReturnValue(makeQueryResult([]) as UseQueryResult<Store[]>);
    vi.mocked(MapScreen).mockImplementation(() => <></>);
    mockSetRadius.mockReset();
  });

  function lastProps(): MapScreenProps {
    const calls = vi.mocked(MapScreen).mock.calls;
    const last = calls.at(-1);
    if (!last) throw new Error("MapScreen was never rendered");
    return last[0];
  }

  it("passes stores from useStoresNearbyQuery to MapScreen", () => {
    const stores = [createStore(), createStore()];
    vi.mocked(useStoresNearbyQuery).mockReturnValue(
      makeQueryResult(stores) as UseQueryResult<Store[]>,
    );
    renderWithProviders(<MapScreenContainer />);
    expect(lastProps().stores).toEqual(stores);
  });

  it("defaults to empty stores when query has no data", () => {
    vi.mocked(useStoresNearbyQuery).mockReturnValue(makeQueryResult([]) as UseQueryResult<Store[]>);
    renderWithProviders(<MapScreenContainer />);
    expect(lastProps().stores).toEqual([]);
  });

  it("passes geo state to MapScreen", () => {
    const geo = makeGeo({ status: "denied" });
    vi.mocked(useGeolocation).mockReturnValue(geo);
    renderWithProviders(<MapScreenContainer />);
    expect(lastProps().geo.status).toBe("denied");
  });

  it("sets isRecentering true when geo.status is loading", () => {
    vi.mocked(useGeolocation).mockReturnValue(makeGeo({ status: "loading" }));
    renderWithProviders(<MapScreenContainer />);
    expect(lastProps().isRecentering).toBe(true);
  });

  it("sets isRecentering false when geo.status is granted", () => {
    vi.mocked(useGeolocation).mockReturnValue(
      makeGeo({
        status: "granted",
        coords: { lat: -34.6037, lng: -58.3816 },
        accuracy: 10,
      }),
    );
    renderWithProviders(<MapScreenContainer />);
    expect(lastProps().isRecentering).toBe(false);
  });

  it("starts with selectedStoreId null", () => {
    renderWithProviders(<MapScreenContainer />);
    expect(lastProps().selectedStoreId).toBeNull();
  });

  it("sets selectedStoreId when onSelectStore is called", () => {
    renderWithProviders(<MapScreenContainer />);
    act(() => {
      lastProps().onSelectStore("store-42");
    });
    expect(lastProps().selectedStoreId).toBe("store-42");
  });

  it("clears selectedStoreId when onDismissStoreDetail is called", () => {
    renderWithProviders(<MapScreenContainer />);
    act(() => {
      lastProps().onSelectStore("store-42");
    });
    act(() => {
      lastProps().onDismissStoreDetail();
    });
    expect(lastProps().selectedStoreId).toBeNull();
  });

  it("calls setRadius with MAX_EXPAND_RADIUS when onExpandRadius is called", () => {
    renderWithProviders(<MapScreenContainer />);
    act(() => {
      lastProps().onExpandRadius();
    });
    expect(mockSetRadius).toHaveBeenCalledWith(MAX_EXPAND_RADIUS);
  });

  it("calls geo.request when onRecenter is called", () => {
    const requestFn = vi.fn();
    vi.mocked(useGeolocation).mockReturnValue(makeGeo({ request: requestFn }));
    renderWithProviders(<MapScreenContainer />);
    act(() => {
      lastProps().onRecenter();
    });
    expect(requestFn).toHaveBeenCalledOnce();
  });

  it("passes null coords to useStoresNearbyQuery when geo is not granted", () => {
    vi.mocked(useGeolocation).mockReturnValue(makeGeo({ status: "idle" }));
    renderWithProviders(<MapScreenContainer />);
    expect(vi.mocked(useStoresNearbyQuery)).toHaveBeenCalledWith(
      expect.objectContaining({ coords: null }),
    );
  });

  it("passes coords to useStoresNearbyQuery when geo is granted", () => {
    const coords = { lat: -34.6037, lng: -58.3816 };
    vi.mocked(useGeolocation).mockReturnValue(makeGeo({ status: "granted", coords, accuracy: 10 }));
    renderWithProviders(<MapScreenContainer />);
    expect(vi.mocked(useStoresNearbyQuery)).toHaveBeenCalledWith(
      expect.objectContaining({ coords }),
    );
  });
});
