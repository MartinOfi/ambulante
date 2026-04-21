import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useServiceWorkerControllerReload } from "./useServiceWorkerControllerReload";

interface FakeSwContainer {
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

function setupSwMock(): FakeSwContainer {
  const mock: FakeSwContainer = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("navigator", { serviceWorker: mock });
  return mock;
}

describe("useServiceWorkerControllerReload", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers a controllerchange listener on mount", () => {
    const mock = setupSwMock();
    renderHook(() => useServiceWorkerControllerReload());
    expect(mock.addEventListener).toHaveBeenCalledWith("controllerchange", expect.any(Function));
  });

  it("removes the controllerchange listener on unmount", () => {
    const mock = setupSwMock();
    const { unmount } = renderHook(() => useServiceWorkerControllerReload());
    unmount();
    expect(mock.removeEventListener).toHaveBeenCalledWith("controllerchange", expect.any(Function));
  });

  it("calls window.location.reload() when controllerchange fires", () => {
    const reloadMock = vi.fn();
    vi.stubGlobal("location", { reload: reloadMock });

    let capturedHandler: (() => void) | null = null;
    const mock: FakeSwContainer = {
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === "controllerchange") capturedHandler = handler;
      }),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal("navigator", { serviceWorker: mock });

    renderHook(() => useServiceWorkerControllerReload());

    if (capturedHandler) (capturedHandler as () => void)();

    expect(reloadMock).toHaveBeenCalledOnce();
  });

  it("does not register listener when serviceWorker is not supported", () => {
    vi.stubGlobal("navigator", {});
    // Should not throw
    expect(() => renderHook(() => useServiceWorkerControllerReload())).not.toThrow();
  });

  it("uses the same handler reference for add and remove (stable reference)", () => {
    const mock = setupSwMock();
    const { unmount } = renderHook(() => useServiceWorkerControllerReload());

    const addedHandler = (mock.addEventListener as ReturnType<typeof vi.fn>).mock
      .calls[0][1] as unknown;
    unmount();
    const removedHandler = (mock.removeEventListener as ReturnType<typeof vi.fn>).mock
      .calls[0][1] as unknown;

    expect(addedHandler).toBe(removedHandler);
  });
});
