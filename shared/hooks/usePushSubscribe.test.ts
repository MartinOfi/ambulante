import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

import { pushService } from "@/shared/services";
import { logger } from "@/shared/utils/logger";
import { usePushSubscribe } from "./usePushSubscribe";

vi.mock("@/shared/services", () => ({
  pushService: {
    getPermissionStatus: vi.fn(),
    requestPermission: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    sendTestNotification: vi.fn(),
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const getPermissionStatusMock = vi.mocked(pushService.getPermissionStatus);
const subscribeMock = vi.mocked(pushService.subscribe);
const unsubscribeMock = vi.mocked(pushService.unsubscribe);

const MOCK_SUBSCRIPTION = {
  endpoint: "https://example.com/push/abc",
  keys: { p256dh: "p256-key", auth: "auth-key" },
};

beforeEach(() => {
  vi.resetAllMocks();
  getPermissionStatusMock.mockReturnValue("default");
});

describe("usePushSubscribe", () => {
  it("inicia con el permiso del browser y isSubscribed=false", () => {
    getPermissionStatusMock.mockReturnValue("default");
    const { result } = renderHook(() => usePushSubscribe());
    expect(result.current.permission).toBe("default");
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.isSupported).toBe(true);
  });

  it("isSupported=false cuando el browser no soporta Notifications", () => {
    getPermissionStatusMock.mockReturnValue("unavailable");
    const { result } = renderHook(() => usePushSubscribe());
    expect(result.current.isSupported).toBe(false);
  });

  it("subscribe() exitoso → isSubscribed pasa a true y permission se actualiza", async () => {
    getPermissionStatusMock.mockReturnValueOnce("default").mockReturnValue("granted");
    subscribeMock.mockResolvedValueOnce(MOCK_SUBSCRIPTION);

    const { result } = renderHook(() => usePushSubscribe());

    await act(async () => {
      await result.current.subscribe();
    });

    expect(subscribeMock).toHaveBeenCalledTimes(1);
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.permission).toBe("granted");
  });

  it("subscribe() retorna null (permission denied) → isSubscribed queda en false", async () => {
    getPermissionStatusMock.mockReturnValue("denied");
    subscribeMock.mockResolvedValueOnce(null);

    const { result } = renderHook(() => usePushSubscribe());

    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.permission).toBe("denied");
  });

  it("subscribe() throw → loggea y deja isSubscribed=false", async () => {
    getPermissionStatusMock.mockReturnValue("default");
    subscribeMock.mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(() => usePushSubscribe());

    await act(async () => {
      await result.current.subscribe();
    });

    expect(logger.error).toHaveBeenCalledWith(
      "usePushSubscribe.subscribe failed",
      expect.objectContaining({ error: "network" }),
    );
    expect(result.current.isSubscribed).toBe(false);
  });

  it("unsubscribe() exitoso → isSubscribed pasa a false", async () => {
    getPermissionStatusMock.mockReturnValue("granted");
    subscribeMock.mockResolvedValueOnce(MOCK_SUBSCRIPTION);
    unsubscribeMock.mockResolvedValueOnce(true);

    const { result } = renderHook(() => usePushSubscribe());

    // Primero suscribir.
    await act(async () => {
      await result.current.subscribe();
    });
    expect(result.current.isSubscribed).toBe(true);

    // Luego desuscribir.
    await act(async () => {
      await result.current.unsubscribe();
    });
    expect(result.current.isSubscribed).toBe(false);
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  it("unsubscribe() retorna false → isSubscribed sigue como estaba", async () => {
    getPermissionStatusMock.mockReturnValue("granted");
    subscribeMock.mockResolvedValueOnce(MOCK_SUBSCRIPTION);
    unsubscribeMock.mockResolvedValueOnce(false);

    const { result } = renderHook(() => usePushSubscribe());

    await act(async () => {
      await result.current.subscribe();
    });
    expect(result.current.isSubscribed).toBe(true);

    await act(async () => {
      await result.current.unsubscribe();
    });
    expect(result.current.isSubscribed).toBe(true);
  });

  it("isPending es true durante la operación de subscribe", async () => {
    getPermissionStatusMock.mockReturnValue("default");
    let resolveSub!: (value: typeof MOCK_SUBSCRIPTION | null) => void;
    subscribeMock.mockReturnValueOnce(
      new Promise((res) => {
        resolveSub = res;
      }),
    );

    const { result } = renderHook(() => usePushSubscribe());

    act(() => {
      void result.current.subscribe();
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    await act(async () => {
      resolveSub(MOCK_SUBSCRIPTION);
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it("refresca permission al volver a visible", () => {
    getPermissionStatusMock.mockReturnValue("default");
    const { result } = renderHook(() => usePushSubscribe());
    expect(result.current.permission).toBe("default");

    // Usuario cambió permiso en otra pestaña; vuelve a focus.
    getPermissionStatusMock.mockReturnValue("granted");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current.permission).toBe("granted");
  });
});
