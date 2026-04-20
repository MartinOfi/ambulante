import { describe, it, expect, beforeEach } from "vitest";
import { createAnalyticsService, type AnalyticsTransport } from "./analytics";
import { ANALYTICS_EVENT } from "@/shared/constants/analytics-events";

function makeTransport(): AnalyticsTransport & {
  calls: Array<{ name: string; props: Record<string, unknown> }>;
} {
  const calls: Array<{ name: string; props: Record<string, unknown> }> = [];
  return {
    calls,
    send(name, props) {
      calls.push({ name, props });
    },
  };
}

describe("analyticsService", () => {
  let transport: ReturnType<typeof makeTransport>;

  beforeEach(() => {
    transport = makeTransport();
  });

  it("tracks ORDER_SENT with required props", () => {
    const svc = createAnalyticsService(transport);
    svc.track(ANALYTICS_EVENT.ORDER_SENT, { storeId: "s1", itemCount: 3 });
    expect(transport.calls).toHaveLength(1);
    expect(transport.calls[0].name).toBe("ORDER_SENT");
    expect(transport.calls[0].props).toMatchObject({ storeId: "s1", itemCount: 3 });
  });

  it("tracks ORDER_ACCEPTED with waitMs", () => {
    const svc = createAnalyticsService(transport);
    svc.track(ANALYTICS_EVENT.ORDER_ACCEPTED, { storeId: "s1", waitMs: 4500 });
    expect(transport.calls[0].props).toMatchObject({ storeId: "s1", waitMs: 4500 });
  });

  it("tracks ORDER_REJECTED with optional reason", () => {
    const svc = createAnalyticsService(transport);
    svc.track(ANALYTICS_EVENT.ORDER_REJECTED, { storeId: "s1", reason: "cerrado" });
    expect(transport.calls[0].name).toBe("ORDER_REJECTED");
    expect(transport.calls[0].props.reason).toBe("cerrado");
  });

  it("tracks ORDER_EXPIRED without extra props", () => {
    const svc = createAnalyticsService(transport);
    svc.track(ANALYTICS_EVENT.ORDER_EXPIRED, { storeId: "s1" });
    expect(transport.calls[0].name).toBe("ORDER_EXPIRED");
  });

  it("tracks ORDER_FINISHED with totalMs", () => {
    const svc = createAnalyticsService(transport);
    svc.track(ANALYTICS_EVENT.ORDER_FINISHED, { storeId: "s1", totalMs: 120000 });
    expect(transport.calls[0].props.totalMs).toBe(120000);
  });

  it("tracks STORE_VIEWED with storeId", () => {
    const svc = createAnalyticsService(transport);
    svc.track(ANALYTICS_EVENT.STORE_VIEWED, { storeId: "s2" });
    expect(transport.calls[0].name).toBe("STORE_VIEWED");
    expect(transport.calls[0].props.storeId).toBe("s2");
  });

  it("tracks ORDER_CANCELLED", () => {
    const svc = createAnalyticsService(transport);
    svc.track(ANALYTICS_EVENT.ORDER_CANCELLED, { storeId: "s1" });
    expect(transport.calls[0].name).toBe("ORDER_CANCELLED");
  });

  it("tracks ORDER_ON_THE_WAY", () => {
    const svc = createAnalyticsService(transport);
    svc.track(ANALYTICS_EVENT.ORDER_ON_THE_WAY, { storeId: "s1" });
    expect(transport.calls[0].name).toBe("ORDER_ON_THE_WAY");
  });

  it("tracks MAP_OPENED with empty payload", () => {
    const svc = createAnalyticsService(transport);
    svc.track(ANALYTICS_EVENT.MAP_OPENED, {});
    expect(transport.calls[0].name).toBe("MAP_OPENED");
  });

  it("throws on invalid props and does not call transport", () => {
    const svc = createAnalyticsService(transport);
    expect(() =>
      // @ts-expect-error intentional bad payload
      svc.track(ANALYTICS_EVENT.ORDER_SENT, { storeId: 123 }),
    ).toThrow();
    expect(transport.calls).toHaveLength(0);
  });
});
