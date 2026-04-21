"use client";

import { describe, expect, it, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/shared/test-utils";
import { createStore } from "@/shared/test-utils";
import type { ViewState } from "react-map-gl/maplibre";
import type { MapCanvasProps } from "./MapCanvas";
import { MapCanvas } from "./MapCanvas";

// react-map-gl uses WebGL APIs not available in jsdom
vi.mock("react-map-gl/maplibre", () => ({
  Map: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="maplibre-map">{children}</div>
  ),
  Marker: ({
    longitude,
    latitude,
    children,
  }: {
    longitude: number;
    latitude: number;
    children?: React.ReactNode;
  }) => (
    <div data-testid="maplibre-marker" data-lng={longitude} data-lat={latitude}>
      {children}
    </div>
  ),
  NavigationControl: () => <div data-testid="navigation-control" />,
}));

vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));

const STUB_VIEW_STATE: ViewState = {
  longitude: -58.3816,
  latitude: -34.6037,
  zoom: 14,
  bearing: 0,
  pitch: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 },
};

function buildProps(overrides: Partial<MapCanvasProps> = {}): MapCanvasProps {
  return {
    stores: [],
    hasUserLocation: false,
    viewState: STUB_VIEW_STATE,
    onMove: vi.fn(),
    onSelectStore: vi.fn(),
    ...overrides,
  };
}

describe("MapCanvas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the map container", () => {
    renderWithProviders(<MapCanvas {...buildProps()} />);
    expect(screen.getByTestId("maplibre-map")).toBeInTheDocument();
  });

  it("renders a marker for each store", () => {
    const stores = [createStore(), createStore()];
    renderWithProviders(<MapCanvas {...buildProps({ stores })} />);
    const markers = screen.getAllByTestId("maplibre-marker");
    expect(markers).toHaveLength(2);
  });

  it("positions store markers at store coordinates", () => {
    const store = createStore({
      location: { lat: -34.6037, lng: -58.3816 },
    });
    renderWithProviders(<MapCanvas {...buildProps({ stores: [store] })} />);
    const marker = screen.getByTestId("maplibre-marker");
    expect(marker).toHaveAttribute("data-lat", String(store.location.lat));
    expect(marker).toHaveAttribute("data-lng", String(store.location.lng));
  });

  it("does not render user location marker when hasUserLocation is false", () => {
    renderWithProviders(<MapCanvas {...buildProps({ hasUserLocation: false })} />);
    expect(screen.queryByTestId("user-location-pin")).not.toBeInTheDocument();
  });

  it("renders user location marker when userCoords provided and hasUserLocation is true", () => {
    const userCoords = { lat: -34.6, lng: -58.38 };
    renderWithProviders(<MapCanvas {...buildProps({ hasUserLocation: true, userCoords })} />);
    const markers = screen.getAllByTestId("maplibre-marker");
    const userMarker = markers.find((m) => m.getAttribute("data-lat") === String(userCoords.lat));
    expect(userMarker).toBeDefined();
  });

  it("calls onSelectStore with store id when store marker is clicked", async () => {
    const user = userEvent.setup();
    const onSelectStore = vi.fn();
    const store = createStore();
    renderWithProviders(<MapCanvas {...buildProps({ stores: [store], onSelectStore })} />);
    await user.click(screen.getByRole("button", { name: store.name }));
    expect(onSelectStore).toHaveBeenCalledWith(store.id);
  });

  it("renders NavigationControl", () => {
    renderWithProviders(<MapCanvas {...buildProps()} />);
    expect(screen.getByTestId("navigation-control")).toBeInTheDocument();
  });
});
