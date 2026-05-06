import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { DEFAULT_RADIUS } from "@/shared/constants/radius";
import { createStore } from "@/shared/test-utils";
import { renderWithProviders, screen } from "@/shared/test-utils";
import type { MapScreenProps } from "./MapScreen";
import { MapScreen } from "./MapScreen";

// dynamic() wraps lazy imports; bypass it so MapCanvasContainer resolves synchronously in tests
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>) => {
    let Component: React.ComponentType | null = null;
    loader().then((mod) => {
      Component = mod.default;
    });
    const Wrapper = (props: Record<string, unknown>) =>
      Component ? <Component {...props} /> : null;
    Wrapper.displayName = "DynamicMock";
    return Wrapper;
  },
}));

vi.mock("./MapCanvas.container", () => ({
  MapCanvasContainer: () => <div data-testid="map-canvas" />,
  default: () => <div data-testid="map-canvas" />,
}));

vi.mock("./TopHeader", () => ({
  TopHeader: () => <div data-testid="top-header" />,
}));

vi.mock("./RecenterFAB", () => ({
  RecenterFAB: ({ onClick, disabled }: { onClick: () => void; disabled: boolean }) => (
    <button data-testid="recenter-fab" onClick={onClick} disabled={disabled} />
  ),
}));

vi.mock("./NearbyBottomSheet", () => ({
  NearbyBottomSheet: () => <div data-testid="nearby-bottom-sheet" />,
}));

vi.mock("./StoreDetailSheet", () => ({
  StoreDetailSheetContainer: ({
    storeId,
    onDismiss,
  }: {
    storeId: string;
    onDismiss: () => void;
  }) => (
    <div data-testid="store-detail-sheet" data-store-id={storeId}>
      <button data-testid="dismiss-btn" onClick={onDismiss} />
    </div>
  ),
}));

vi.mock("./LocationDenied", () => ({
  LocationDenied: ({
    onRetry,
    onManualSearch,
  }: {
    onRetry: () => void;
    onManualSearch: () => void;
  }) => (
    <div data-testid="location-denied">
      <button data-testid="retry-btn" onClick={onRetry} />
      <button data-testid="manual-search-btn" onClick={onManualSearch} />
    </div>
  ),
}));

function buildProps(overrides: Partial<MapScreenProps> = {}): MapScreenProps {
  return {
    stores: [],
    radius: DEFAULT_RADIUS,
    geo: { status: "idle" },
    isRecentering: false,
    selectedStoreId: null,
    onRadiusChange: vi.fn(),
    onExpandRadius: vi.fn(),
    onRecenter: vi.fn(),
    onRetryGeolocation: vi.fn(),
    onManualSearch: vi.fn(),
    cartItemCount: 0,
    cartTotal: 0,
    isCheckingOut: false,
    onCheckout: vi.fn(),
    onSelectStore: vi.fn(),
    onDismissStoreDetail: vi.fn(),
    ...overrides,
  };
}

describe("MapScreen", () => {
  it("renders map canvas and top header", () => {
    renderWithProviders(<MapScreen {...buildProps()} />);
    expect(screen.getByTestId("map-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("top-header")).toBeInTheDocument();
  });

  it("renders NearbyBottomSheet when no store is selected", () => {
    renderWithProviders(<MapScreen {...buildProps({ selectedStoreId: null })} />);
    expect(screen.getByTestId("nearby-bottom-sheet")).toBeInTheDocument();
    expect(screen.queryByTestId("store-detail-sheet")).not.toBeInTheDocument();
  });

  it("renders StoreDetailSheetContainer when a store is selected", () => {
    const store = createStore();
    renderWithProviders(<MapScreen {...buildProps({ selectedStoreId: store.id })} />);
    expect(screen.getByTestId("store-detail-sheet")).toBeInTheDocument();
    expect(screen.getByTestId("store-detail-sheet")).toHaveAttribute("data-store-id", store.id);
    expect(screen.queryByTestId("nearby-bottom-sheet")).not.toBeInTheDocument();
  });

  it("does not render LocationDenied when geo is idle", () => {
    renderWithProviders(<MapScreen {...buildProps({ geo: { status: "idle" } })} />);
    expect(screen.queryByTestId("location-denied")).not.toBeInTheDocument();
  });

  it("renders LocationDenied when geo.status is denied", () => {
    renderWithProviders(<MapScreen {...buildProps({ geo: { status: "denied" } })} />);
    expect(screen.getByTestId("location-denied")).toBeInTheDocument();
  });

  it("calls onRetryGeolocation when retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetryGeolocation = vi.fn();
    renderWithProviders(
      <MapScreen {...buildProps({ geo: { status: "denied" }, onRetryGeolocation })} />,
    );
    await user.click(screen.getByTestId("retry-btn"));
    expect(onRetryGeolocation).toHaveBeenCalledOnce();
  });

  it("calls onManualSearch when manual search button is clicked", async () => {
    const user = userEvent.setup();
    const onManualSearch = vi.fn();
    renderWithProviders(
      <MapScreen {...buildProps({ geo: { status: "denied" }, onManualSearch })} />,
    );
    await user.click(screen.getByTestId("manual-search-btn"));
    expect(onManualSearch).toHaveBeenCalledOnce();
  });

  it("calls onRecenter when recenter FAB is clicked", async () => {
    const user = userEvent.setup();
    const onRecenter = vi.fn();
    renderWithProviders(<MapScreen {...buildProps({ onRecenter })} />);
    await user.click(screen.getByTestId("recenter-fab"));
    expect(onRecenter).toHaveBeenCalledOnce();
  });

  it("disables recenter FAB when isRecentering is true", () => {
    renderWithProviders(<MapScreen {...buildProps({ isRecentering: true })} />);
    expect(screen.getByTestId("recenter-fab")).toBeDisabled();
  });

  it("calls onDismissStoreDetail when dismiss button in sheet is clicked", async () => {
    const user = userEvent.setup();
    const onDismissStoreDetail = vi.fn();
    const store = createStore();
    renderWithProviders(
      <MapScreen {...buildProps({ selectedStoreId: store.id, onDismissStoreDetail })} />,
    );
    await user.click(screen.getByTestId("dismiss-btn"));
    expect(onDismissStoreDetail).toHaveBeenCalledOnce();
  });
});
