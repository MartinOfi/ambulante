import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { auditLogService } from "./audit-log.mock";
import { ORDER_STATUS } from "@/shared/constants/order";

describe("auditLogService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns audit log result for a known order ID", async () => {
    const promise = auditLogService.findByOrderId("order-demo-completed");
    vi.runAllTimers();
    const result = await promise;

    expect(result).not.toBeNull();
    expect(result?.orderId).toBe("order-demo-completed");
    expect(result?.entries.length).toBeGreaterThan(0);
  });

  it("returns null for an unknown order ID", async () => {
    const promise = auditLogService.findByOrderId("order-does-not-exist");
    vi.runAllTimers();
    const result = await promise;

    expect(result).toBeNull();
  });

  it("returns completed order with FINALIZADO as last entry status", async () => {
    const promise = auditLogService.findByOrderId("order-demo-completed");
    vi.runAllTimers();
    const result = await promise;

    const statuses = result?.entries.map((entry) => entry.newStatus) ?? [];
    expect(statuses).toContain(ORDER_STATUS.FINALIZADO);
  });

  it("returns rejected order with RECHAZADO entry", async () => {
    const promise = auditLogService.findByOrderId("order-demo-rejected");
    vi.runAllTimers();
    const result = await promise;

    const statuses = result?.entries.map((entry) => entry.newStatus) ?? [];
    expect(statuses).toContain(ORDER_STATUS.RECHAZADO);
  });

  it("returns expired order with EXPIRADO entry", async () => {
    const promise = auditLogService.findByOrderId("order-demo-expired");
    vi.runAllTimers();
    const result = await promise;

    const statuses = result?.entries.map((entry) => entry.newStatus) ?? [];
    expect(statuses).toContain(ORDER_STATUS.EXPIRADO);
  });

  it("returns cancelled order with CANCELADO entry", async () => {
    const promise = auditLogService.findByOrderId("order-demo-cancelled");
    vi.runAllTimers();
    const result = await promise;

    const statuses = result?.entries.map((entry) => entry.newStatus) ?? [];
    expect(statuses).toContain(ORDER_STATUS.CANCELADO);
  });

  it("returns entries with Date objects for occurredAt", async () => {
    const promise = auditLogService.findByOrderId("order-demo-completed");
    vi.runAllTimers();
    const result = await promise;

    result?.entries.forEach((entry) => {
      expect(entry.occurredAt).toBeInstanceOf(Date);
    });
  });
});
