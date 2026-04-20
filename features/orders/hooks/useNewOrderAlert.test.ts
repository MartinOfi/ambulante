import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import type { Order } from "@/shared/schemas/order";
import { ORDER_STATUS } from "@/shared/constants/order";
import { useNewOrderAlert } from "./useNewOrderAlert";

function makeOrder(id: string, status: string, createdAt: string): Order {
  return {
    id,
    clientId: "client-1",
    storeId: "store-1",
    status: status as Order["status"],
    items: [{ productId: "p1", productName: "Item", productPriceArs: 100, quantity: 1 }],
    createdAt,
    updatedAt: createdAt,
  };
}

const ORDER_NEW = makeOrder("o1", ORDER_STATUS.ENVIADO, "2026-04-20T10:00:00.000Z");
const ORDER_RECEIVED = makeOrder("o2", ORDER_STATUS.RECIBIDO, "2026-04-20T09:00:00.000Z");
const ORDER_TERMINAL = makeOrder("o3", ORDER_STATUS.FINALIZADO, "2026-04-20T08:00:00.000Z");

describe("useNewOrderAlert", () => {
  let vibrateMock: ReturnType<typeof vi.fn>;
  let audioContextMock: { createOscillator: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vibrateMock = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });

    const oscillatorMock = {
      type: "sine",
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const gainMock = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    };
    audioContextMock = {
      createOscillator: vi.fn().mockReturnValue(oscillatorMock),
    };
    Object.assign(audioContextMock, {
      createGain: vi.fn().mockReturnValue(gainMock),
      destination: {},
      currentTime: 0,
    });
    vi.stubGlobal(
      "AudioContext",
      vi.fn().mockImplementation(() => audioContextMock),
    );
  });

  it("does not alert on initial render", () => {
    renderHook(() => useNewOrderAlert([ORDER_NEW]));
    expect(vibrateMock).not.toHaveBeenCalled();
  });

  it("triggers vibrate when a new pending order is added", () => {
    const { rerender } = renderHook(({ orders }) => useNewOrderAlert(orders), {
      initialProps: { orders: [] as readonly Order[] },
    });

    act(() => {
      rerender({ orders: [ORDER_NEW] });
    });

    expect(vibrateMock).toHaveBeenCalledWith(expect.any(Array));
  });

  it("does not alert when only terminal orders are present", () => {
    const { rerender } = renderHook(({ orders }) => useNewOrderAlert(orders), {
      initialProps: { orders: [] as readonly Order[] },
    });

    act(() => {
      rerender({ orders: [ORDER_TERMINAL] });
    });

    expect(vibrateMock).not.toHaveBeenCalled();
  });

  it("triggers alert for RECIBIDO status too (store needs to act)", () => {
    const { rerender } = renderHook(({ orders }) => useNewOrderAlert(orders), {
      initialProps: { orders: [] as readonly Order[] },
    });

    act(() => {
      rerender({ orders: [ORDER_RECEIVED] });
    });

    expect(vibrateMock).toHaveBeenCalled();
  });

  it("does not re-alert when count stays the same", () => {
    const { rerender } = renderHook(({ orders }) => useNewOrderAlert(orders), {
      initialProps: { orders: [ORDER_NEW] as readonly Order[] },
    });

    act(() => {
      rerender({ orders: [ORDER_NEW] });
    });

    expect(vibrateMock).not.toHaveBeenCalled();
  });
});
