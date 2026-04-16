import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ORDER_AUTOCLOSE_HOURS,
  ORDER_EXPIRATION_MINUTES,
  ORDER_STATUS,
} from "@/shared/constants/order";
import { ORDER_TIMEOUT_POLICIES, createSetTimeoutScheduler } from "./timeouts";

describe("ORDER_TIMEOUT_POLICIES", () => {
  it("ENVIADO has delay of ORDER_EXPIRATION_MINUTES converted to ms", () => {
    expect(ORDER_TIMEOUT_POLICIES[ORDER_STATUS.ENVIADO]?.delayMs).toBe(
      ORDER_EXPIRATION_MINUTES * 60_000,
    );
  });

  it("RECIBIDO has delay of ORDER_EXPIRATION_MINUTES converted to ms", () => {
    expect(ORDER_TIMEOUT_POLICIES[ORDER_STATUS.RECIBIDO]?.delayMs).toBe(
      ORDER_EXPIRATION_MINUTES * 60_000,
    );
  });

  it("ACEPTADO has delay of ORDER_AUTOCLOSE_HOURS converted to ms", () => {
    expect(ORDER_TIMEOUT_POLICIES[ORDER_STATUS.ACEPTADO]?.delayMs).toBe(
      ORDER_AUTOCLOSE_HOURS * 3_600_000,
    );
  });

  it("terminal and non-timed statuses have no policy", () => {
    expect(ORDER_TIMEOUT_POLICIES[ORDER_STATUS.EN_CAMINO]).toBeUndefined();
    expect(ORDER_TIMEOUT_POLICIES[ORDER_STATUS.FINALIZADO]).toBeUndefined();
    expect(ORDER_TIMEOUT_POLICIES[ORDER_STATUS.RECHAZADO]).toBeUndefined();
    expect(ORDER_TIMEOUT_POLICIES[ORDER_STATUS.EXPIRADO]).toBeUndefined();
    expect(ORDER_TIMEOUT_POLICIES[ORDER_STATUS.CANCELADO]).toBeUndefined();
  });

  it("policies object is frozen (immutable)", () => {
    expect(Object.isFrozen(ORDER_TIMEOUT_POLICIES)).toBe(true);
  });
});

describe("createSetTimeoutScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls onFire with orderId after ENVIADO delay", () => {
    const scheduler = createSetTimeoutScheduler();
    const onFire = vi.fn();

    scheduler.schedule({ orderId: "order-1", status: ORDER_STATUS.ENVIADO, onFire });

    expect(onFire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(ORDER_EXPIRATION_MINUTES * 60_000);
    expect(onFire).toHaveBeenCalledTimes(1);
    expect(onFire).toHaveBeenCalledWith("order-1");
  });

  it("calls onFire with orderId after RECIBIDO delay", () => {
    const scheduler = createSetTimeoutScheduler();
    const onFire = vi.fn();

    scheduler.schedule({ orderId: "order-2", status: ORDER_STATUS.RECIBIDO, onFire });
    vi.advanceTimersByTime(ORDER_EXPIRATION_MINUTES * 60_000);

    expect(onFire).toHaveBeenCalledWith("order-2");
  });

  it("calls onFire with orderId after ACEPTADO delay", () => {
    const scheduler = createSetTimeoutScheduler();
    const onFire = vi.fn();

    scheduler.schedule({ orderId: "order-3", status: ORDER_STATUS.ACEPTADO, onFire });
    vi.advanceTimersByTime(ORDER_AUTOCLOSE_HOURS * 3_600_000);

    expect(onFire).toHaveBeenCalledWith("order-3");
  });

  it("does not fire before the delay elapses", () => {
    const scheduler = createSetTimeoutScheduler();
    const onFire = vi.fn();

    scheduler.schedule({ orderId: "order-1", status: ORDER_STATUS.ENVIADO, onFire });
    vi.advanceTimersByTime(ORDER_EXPIRATION_MINUTES * 60_000 - 1);

    expect(onFire).not.toHaveBeenCalled();
  });

  it("cleanup cancels the timer before it fires", () => {
    const scheduler = createSetTimeoutScheduler();
    const onFire = vi.fn();

    const cancel = scheduler.schedule({ orderId: "order-1", status: ORDER_STATUS.ENVIADO, onFire });
    cancel();
    vi.advanceTimersByTime(ORDER_EXPIRATION_MINUTES * 60_000);

    expect(onFire).not.toHaveBeenCalled();
  });

  it("returns a no-op cleanup for states without a policy", () => {
    const scheduler = createSetTimeoutScheduler();
    const onFire = vi.fn();

    const cancel = scheduler.schedule({
      orderId: "order-1",
      status: ORDER_STATUS.FINALIZADO,
      onFire,
    });
    expect(() => cancel()).not.toThrow();
    vi.advanceTimersByTime(999_999_999);
    expect(onFire).not.toHaveBeenCalled();
  });

  it("no-op for EN_CAMINO (no policy defined)", () => {
    const scheduler = createSetTimeoutScheduler();
    const onFire = vi.fn();

    scheduler.schedule({ orderId: "order-1", status: ORDER_STATUS.EN_CAMINO, onFire });
    vi.advanceTimersByTime(999_999_999);

    expect(onFire).not.toHaveBeenCalled();
  });

  it("cancelling after fire does not throw", () => {
    const scheduler = createSetTimeoutScheduler();
    const onFire = vi.fn();

    const cancel = scheduler.schedule({ orderId: "order-1", status: ORDER_STATUS.ENVIADO, onFire });
    vi.advanceTimersByTime(ORDER_EXPIRATION_MINUTES * 60_000);
    expect(() => cancel()).not.toThrow();
  });
});
