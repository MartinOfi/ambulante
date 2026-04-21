import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  SW_MESSAGE_TYPE,
  SW_UPDATE_STATUS,
  SW_UPDATE_CHECK_INTERVAL_MS,
} from "@/shared/constants/service-worker";
import { useServiceWorkerUpdate } from "./useServiceWorkerUpdate";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface FakeInstalling {
  state: string;
  readonly listenerMap: Map<string, Array<(e: Event) => void>>;
  addEventListener: ReturnType<typeof vi.fn>;
  postMessage?: ReturnType<typeof vi.fn>;
  dispatchStateChange: (state: string) => void;
}

interface FakeRegistration {
  installing: FakeInstalling | null;
  waiting: (FakeInstalling & { postMessage: ReturnType<typeof vi.fn> }) | null;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  dispatchUpdateFound: (installing: FakeInstalling) => void;
}

function makeInstalling(): FakeInstalling {
  const listenerMap = new Map<string, Array<(e: Event) => void>>();
  const inst: FakeInstalling = {
    state: "installing",
    listenerMap,
    addEventListener: vi.fn((event: string, handler: (e: Event) => void) => {
      listenerMap.set(event, [...(listenerMap.get(event) ?? []), handler]);
    }),
    dispatchStateChange(newState: string) {
      inst.state = newState;
      for (const h of listenerMap.get("statechange") ?? []) {
        h(new Event("statechange"));
      }
    },
  };
  return inst;
}

function makeRegistration(): FakeRegistration {
  const listenerMap = new Map<string, Array<(e: Event) => void>>();
  const reg: FakeRegistration = {
    installing: null,
    waiting: null,
    addEventListener: vi.fn((event: string, handler: (e: Event) => void) => {
      listenerMap.set(event, [...(listenerMap.get(event) ?? []), handler]);
    }),
    removeEventListener: vi.fn((event: string, handler: (e: Event) => void) => {
      listenerMap.set(
        event,
        (listenerMap.get(event) ?? []).filter((h) => h !== handler),
      );
    }),
    update: vi.fn().mockResolvedValue(undefined),
    dispatchUpdateFound(installing: FakeInstalling) {
      reg.installing = installing;
      for (const h of listenerMap.get("updatefound") ?? []) {
        h(new Event("updatefound"));
      }
    },
  };
  return reg;
}

function setupSwMock(
  reg: FakeRegistration | null,
  controller: ServiceWorker | null = {} as ServiceWorker,
) {
  const mock = {
    controller,
    getRegistration: vi.fn().mockResolvedValue(reg),
  };
  vi.stubGlobal("navigator", { serviceWorker: mock });
  return mock;
}

// Flushes all pending microtasks (including Promise.then callbacks)
async function flushMicrotasks() {
  await act(() => Promise.resolve());
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useServiceWorkerUpdate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("starts with idle status", () => {
    const reg = makeRegistration();
    setupSwMock(reg);
    const { result } = renderHook(() => useServiceWorkerUpdate());
    expect(result.current.status).toBe(SW_UPDATE_STATUS.IDLE);
  });

  it("remains idle when serviceWorker is not supported", () => {
    vi.stubGlobal("navigator", {});
    const { result } = renderHook(() => useServiceWorkerUpdate());
    expect(result.current.status).toBe(SW_UPDATE_STATUS.IDLE);
  });

  it("calls getRegistration on mount", async () => {
    const reg = makeRegistration();
    const mock = setupSwMock(reg);
    renderHook(() => useServiceWorkerUpdate());
    await flushMicrotasks();
    expect(mock.getRegistration).toHaveBeenCalledOnce();
  });

  it("registers updatefound listener on the registration", async () => {
    const reg = makeRegistration();
    setupSwMock(reg);
    renderHook(() => useServiceWorkerUpdate());
    await flushMicrotasks();
    expect(reg.addEventListener).toHaveBeenCalledWith("updatefound", expect.any(Function));
  });

  it("transitions to available when installing SW reaches 'installed' state", async () => {
    const reg = makeRegistration();
    const mock = setupSwMock(reg);
    const { result } = renderHook(() => useServiceWorkerUpdate());
    await flushMicrotasks();

    const installing = makeInstalling();
    act(() => {
      reg.dispatchUpdateFound(installing);
    });
    act(() => {
      mock.controller = {} as ServiceWorker;
      installing.dispatchStateChange("installed");
    });

    await waitFor(() => expect(result.current.status).toBe(SW_UPDATE_STATUS.AVAILABLE));
  });

  it("does not transition to available if controller is null (first SW install)", async () => {
    const reg = makeRegistration();
    setupSwMock(reg, null);
    const { result } = renderHook(() => useServiceWorkerUpdate());
    await flushMicrotasks();

    const installing = makeInstalling();
    act(() => {
      reg.dispatchUpdateFound(installing);
    });
    act(() => {
      installing.dispatchStateChange("installed");
    });

    expect(result.current.status).toBe(SW_UPDATE_STATUS.IDLE);
  });

  it("shows available immediately when registration already has a waiting SW", async () => {
    const waiting = makeInstalling() as FakeInstalling & { postMessage: ReturnType<typeof vi.fn> };
    waiting.postMessage = vi.fn();
    waiting.state = "installed";
    const reg = makeRegistration();
    reg.waiting = waiting;
    setupSwMock(reg);

    const { result } = renderHook(() => useServiceWorkerUpdate());
    await flushMicrotasks();

    expect(result.current.status).toBe(SW_UPDATE_STATUS.AVAILABLE);
  });

  it("applyUpdate sends SKIP_WAITING message to waiting SW", async () => {
    const waiting = makeInstalling() as FakeInstalling & { postMessage: ReturnType<typeof vi.fn> };
    waiting.postMessage = vi.fn();
    waiting.state = "installed";
    const reg = makeRegistration();
    reg.waiting = waiting;
    setupSwMock(reg);

    const { result } = renderHook(() => useServiceWorkerUpdate());
    await flushMicrotasks();
    await waitFor(() => expect(result.current.status).toBe(SW_UPDATE_STATUS.AVAILABLE));

    act(() => {
      result.current.applyUpdate();
    });

    expect(waiting.postMessage).toHaveBeenCalledWith({ type: SW_MESSAGE_TYPE.SKIP_WAITING });
  });

  it("applyUpdate transitions status to applying", async () => {
    const waiting = makeInstalling() as FakeInstalling & { postMessage: ReturnType<typeof vi.fn> };
    waiting.postMessage = vi.fn();
    waiting.state = "installed";
    const reg = makeRegistration();
    reg.waiting = waiting;
    setupSwMock(reg);

    const { result } = renderHook(() => useServiceWorkerUpdate());
    await flushMicrotasks();
    await waitFor(() => expect(result.current.status).toBe(SW_UPDATE_STATUS.AVAILABLE));

    act(() => {
      result.current.applyUpdate();
    });

    expect(result.current.status).toBe(SW_UPDATE_STATUS.APPLYING);
  });

  it("dismiss transitions status to dismissed", async () => {
    const waiting = makeInstalling() as FakeInstalling & { postMessage: ReturnType<typeof vi.fn> };
    waiting.postMessage = vi.fn();
    waiting.state = "installed";
    const reg = makeRegistration();
    reg.waiting = waiting;
    setupSwMock(reg);

    const { result } = renderHook(() => useServiceWorkerUpdate());
    await flushMicrotasks();
    await waitFor(() => expect(result.current.status).toBe(SW_UPDATE_STATUS.AVAILABLE));

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.status).toBe(SW_UPDATE_STATUS.DISMISSED);
  });

  it("removes updatefound listener on unmount", async () => {
    const reg = makeRegistration();
    setupSwMock(reg);
    const { unmount } = renderHook(() => useServiceWorkerUpdate());
    await flushMicrotasks();
    unmount();
    expect(reg.removeEventListener).toHaveBeenCalledWith("updatefound", expect.any(Function));
  });

  it("returns applyUpdate and dismiss as functions", () => {
    const reg = makeRegistration();
    setupSwMock(reg);
    const { result } = renderHook(() => useServiceWorkerUpdate());
    expect(typeof result.current.applyUpdate).toBe("function");
    expect(typeof result.current.dismiss).toBe("function");
  });

  // --- Interval tests use fake timers in isolation ---

  it("calls registration.update() after each interval elapses", async () => {
    vi.useFakeTimers();

    const reg = makeRegistration();
    setupSwMock(reg);
    renderHook(() => useServiceWorkerUpdate());

    await act(() => Promise.resolve()); // flush getRegistration().then()

    act(() => {
      vi.advanceTimersByTime(SW_UPDATE_CHECK_INTERVAL_MS);
    });
    expect(reg.update).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(SW_UPDATE_CHECK_INTERVAL_MS);
    });
    expect(reg.update).toHaveBeenCalledTimes(2);
  });

  it("does not call update() before the interval elapses", async () => {
    vi.useFakeTimers();

    const reg = makeRegistration();
    setupSwMock(reg);
    renderHook(() => useServiceWorkerUpdate());

    await act(() => Promise.resolve()); // flush getRegistration().then()

    act(() => {
      vi.advanceTimersByTime(SW_UPDATE_CHECK_INTERVAL_MS - 1);
    });
    expect(reg.update).not.toHaveBeenCalled();
  });
});
