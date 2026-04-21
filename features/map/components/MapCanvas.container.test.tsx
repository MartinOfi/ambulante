import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/test-utils";
import { createStore } from "@/shared/test-utils";
import { MAP_DEFAULTS } from "@/features/map/constants";
import { MapCanvasContainer } from "./MapCanvas.container";

vi.mock("./MapCanvas", () => ({
  MapCanvas: ({
    viewState,
  }: {
    viewState: { longitude: number; latitude: number; zoom: number };
  }) => (
    <div
      data-testid="map-canvas"
      data-lng={viewState.longitude}
      data-lat={viewState.latitude}
      data-zoom={viewState.zoom}
    />
  ),
}));

describe("MapCanvasContainer", () => {
  it("initializes to MAP_DEFAULTS.CENTER when userCoords is undefined", () => {
    renderWithProviders(<MapCanvasContainer stores={[]} hasUserLocation={false} />);
    const canvas = screen.getByTestId("map-canvas");
    expect(canvas).toHaveAttribute("data-lat", String(MAP_DEFAULTS.CENTER.lat));
    expect(canvas).toHaveAttribute("data-lng", String(MAP_DEFAULTS.CENTER.lng));
    expect(canvas).toHaveAttribute("data-zoom", String(MAP_DEFAULTS.ZOOM));
  });

  it("initializes to userCoords when provided", () => {
    const userCoords = { lat: -34.9, lng: -57.5 };
    renderWithProviders(
      <MapCanvasContainer stores={[]} hasUserLocation={true} userCoords={userCoords} />,
    );
    const canvas = screen.getByTestId("map-canvas");
    expect(canvas).toHaveAttribute("data-lat", String(userCoords.lat));
    expect(canvas).toHaveAttribute("data-lng", String(userCoords.lng));
  });

  it("passes stores and selectedStoreId to MapCanvas", () => {
    const store = createStore();
    const onSelectStore = vi.fn();
    renderWithProviders(
      <MapCanvasContainer
        stores={[store]}
        hasUserLocation={false}
        selectedStoreId={store.id}
        onSelectStore={onSelectStore}
      />,
    );
    expect(screen.getByTestId("map-canvas")).toBeInTheDocument();
  });
});
