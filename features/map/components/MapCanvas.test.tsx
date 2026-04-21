"use client";

import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/shared/test-utils";
import { createStore } from "@/shared/test-utils";
import type { ViewState } from "react-map-gl/maplibre";
import type { MapCanvasProps } from "./MapCanvas";
import { MapCanvas } from "./MapCanvas";
import type { ClusterFeature } from "@/features/map/hooks/useClusters";
import { MAP_LAYER_IDS } from "@/features/map/constants";

// Minimal mock click event shape — mirrors MapMouseEvent.features at runtime
interface MockLayerFeature {
  layer: { id: string };
  geometry: { type: string; coordinates: number[] };
  properties: Record<string, unknown>;
}
type MockMapClick = { features?: MockLayerFeature[] };

let capturedMapClick: ((e: MockMapClick) => void) | undefined;

// react-map-gl uses WebGL APIs not available in jsdom
vi.mock("react-map-gl/maplibre", () => ({
  Map: ({
    children,
    onClick,
  }: {
    children?: React.ReactNode;
    onClick?: (e: MockMapClick) => void;
    interactiveLayerIds?: string[];
  }) => {
    capturedMapClick = onClick;
    return <div data-testid="maplibre-map">{children}</div>;
  },
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
  Source: ({ id, children }: { id: string; children?: React.ReactNode }) => (
    <div data-testid={`source-${id}`}>{children}</div>
  ),
  Layer: ({ id }: { id: string }) => <div data-testid={`layer-${id}`} />,
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

function makeStoreFeature(store: ReturnType<typeof createStore>): ClusterFeature {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [store.location.lng, store.location.lat] },
    properties: {
      cluster: false,
      storeId: store.id,
      storeKind: store.kind,
      storeName: store.name,
    },
  };
}

function makeClusterFeature(count: number, lng: number, lat: number): ClusterFeature {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lng, lat] },
    properties: {
      cluster: true,
      cluster_id: 42,
      point_count: count,
      point_count_abbreviated: count,
    },
  };
}

function buildProps(overrides: Partial<MapCanvasProps> = {}): MapCanvasProps {
  return {
    clusters: [],
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
    capturedMapClick = undefined;
  });

  it("renders the map container", () => {
    renderWithProviders(<MapCanvas {...buildProps()} />);
    expect(screen.getByTestId("maplibre-map")).toBeInTheDocument();
  });

  it("renders NavigationControl", () => {
    renderWithProviders(<MapCanvas {...buildProps()} />);
    expect(screen.getByTestId("navigation-control")).toBeInTheDocument();
  });

  it("renders the GeoJSON source", () => {
    renderWithProviders(<MapCanvas {...buildProps()} />);
    expect(screen.getByTestId("source-clusters-source")).toBeInTheDocument();
  });

  it("renders all four layers", () => {
    renderWithProviders(<MapCanvas {...buildProps()} />);
    expect(screen.getByTestId(`layer-${MAP_LAYER_IDS.CLUSTERS_CIRCLE}`)).toBeInTheDocument();
    expect(screen.getByTestId(`layer-${MAP_LAYER_IDS.CLUSTERS_LABEL}`)).toBeInTheDocument();
    expect(screen.getByTestId(`layer-${MAP_LAYER_IDS.STORES_CIRCLE}`)).toBeInTheDocument();
    expect(screen.getByTestId(`layer-${MAP_LAYER_IDS.STORES_ACTIVE}`)).toBeInTheDocument();
  });

  it("does not render user location marker when hasUserLocation is false", () => {
    renderWithProviders(<MapCanvas {...buildProps({ hasUserLocation: false })} />);
    expect(screen.queryByTestId("user-location-pin")).not.toBeInTheDocument();
  });

  it("renders user location marker when userCoords provided and hasUserLocation is true", () => {
    const userCoords = { lat: -34.6, lng: -58.38 };
    renderWithProviders(<MapCanvas {...buildProps({ hasUserLocation: true, userCoords })} />);
    const marker = screen.getByTestId("maplibre-marker");
    expect(marker).toHaveAttribute("data-lat", String(userCoords.lat));
    expect(marker).toHaveAttribute("data-lng", String(userCoords.lng));
  });

  it("does not render any Marker for store features (uses GL layers instead)", () => {
    const store = createStore();
    renderWithProviders(<MapCanvas {...buildProps({ clusters: [makeStoreFeature(store)] })} />);
    // No marker elements — stores are in the GL source, not DOM Markers
    expect(screen.queryByTestId("maplibre-marker")).not.toBeInTheDocument();
  });

  it("calls onSelectStore when map click event has a store feature", () => {
    const onSelectStore = vi.fn();
    const store = createStore();
    renderWithProviders(
      <MapCanvas {...buildProps({ clusters: [makeStoreFeature(store)], onSelectStore })} />,
    );

    capturedMapClick?.({
      features: [
        {
          layer: { id: MAP_LAYER_IDS.STORES_CIRCLE },
          geometry: { type: "Point", coordinates: [store.location.lng, store.location.lat] },
          properties: { storeId: store.id },
        },
      ],
    });

    expect(onSelectStore).toHaveBeenCalledWith(store.id);
  });

  it("calls onSelectStore when clicking the active (selected) store layer", () => {
    const onSelectStore = vi.fn();
    const store = createStore();
    renderWithProviders(
      <MapCanvas
        {...buildProps({
          clusters: [makeStoreFeature(store)],
          selectedStoreId: store.id,
          onSelectStore,
        })}
      />,
    );

    capturedMapClick?.({
      features: [
        {
          layer: { id: MAP_LAYER_IDS.STORES_ACTIVE },
          geometry: { type: "Point", coordinates: [store.location.lng, store.location.lat] },
          properties: { storeId: store.id },
        },
      ],
    });

    expect(onSelectStore).toHaveBeenCalledWith(store.id);
  });

  it("calls onZoomToCluster when map click event has a cluster feature", () => {
    const onZoomToCluster = vi.fn();
    const clusterFeature = makeClusterFeature(5, -58.381, -34.603);
    renderWithProviders(
      <MapCanvas {...buildProps({ clusters: [clusterFeature], onZoomToCluster })} />,
    );

    capturedMapClick?.({
      features: [
        {
          layer: { id: MAP_LAYER_IDS.CLUSTERS_CIRCLE },
          geometry: { type: "Point", coordinates: [-58.381, -34.603] },
          properties: { cluster_id: 42, point_count: 5 },
        },
      ],
    });

    expect(onZoomToCluster).toHaveBeenCalledWith(42, -58.381, -34.603);
  });

  it("ignores map clicks with no features", () => {
    const onSelectStore = vi.fn();
    const onZoomToCluster = vi.fn();
    renderWithProviders(<MapCanvas {...buildProps({ onSelectStore, onZoomToCluster })} />);

    capturedMapClick?.({ features: [] });

    expect(onSelectStore).not.toHaveBeenCalled();
    expect(onZoomToCluster).not.toHaveBeenCalled();
  });

  it("ignores map clicks with non-Point geometry", () => {
    const onSelectStore = vi.fn();
    renderWithProviders(<MapCanvas {...buildProps({ onSelectStore })} />);

    capturedMapClick?.({
      features: [
        {
          layer: { id: MAP_LAYER_IDS.STORES_CIRCLE },
          geometry: { type: "LineString", coordinates: [] },
          properties: { storeId: "x" },
        },
      ],
    });

    expect(onSelectStore).not.toHaveBeenCalled();
  });
});
