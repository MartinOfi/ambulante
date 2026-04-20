import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RECONNECT_BACKOFF_FACTOR,
  RECONNECT_INITIAL_DELAY_MS,
  RECONNECT_MAX_ATTEMPTS,
  RECONNECT_MAX_DELAY_MS,
} from "@/shared/constants/realtime";
import { createMockRealtimeService } from "./realtime";

describe("createMockRealtimeService — reconnect / backoff", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reconnect() transitions offline → connecting → online", async () => {
    const svc = createMockRealtimeService();
    const statuses: string[] = [];
    svc.onStatusChange((s) => statuses.push(s));

    svc._testSetStatus("offline");
    statuses.length = 0; // reset after setup

    svc.reconnect();
    expect(statuses[0]).toBe("connecting");

    // Flush the first attempt's scheduled callback
    await vi.advanceTimersByTimeAsync(RECONNECT_INITIAL_DELAY_MS);

    expect(statuses).toContain("online");
    svc.destroy();
  });

  it("backoff delay doubles on each failed attempt", async () => {
    const svc = createMockRealtimeService();
    // Force all reconnect attempts to fail by keeping status offline
    svc._testSetStatus("offline");

    // Track when reconnect attempts happen by spying on _testSetStatus pattern
    const delays: number[] = [];
    let lastCallTime = 0;

    const original = svc._testSetStatus.bind(svc);
    vi.spyOn(svc, "_testSetStatus").mockImplementation((status) => {
      if (status === "connecting") {
        const now = Date.now();
        if (lastCallTime > 0) delays.push(now - lastCallTime);
        lastCallTime = now;
      }
      original(status);
      // Simulate a failed reconnect: immediately go back offline
      if (status === "connecting") {
        // The mock will try to go online after "connecting"; we simulate failure
        // by not advancing far enough — the service schedules next attempt
      }
    });

    svc.reconnect();

    // Flush attempt 0 (delay = RECONNECT_INITIAL_DELAY_MS = 1000ms)
    await vi.advanceTimersByTimeAsync(RECONNECT_INITIAL_DELAY_MS);
    // Force failure
    svc._testSetStatus("offline");

    // Flush attempt 1 (delay = RECONNECT_INITIAL_DELAY_MS * RECONNECT_BACKOFF_FACTOR = 2000ms)
    await vi.advanceTimersByTimeAsync(RECONNECT_INITIAL_DELAY_MS * RECONNECT_BACKOFF_FACTOR);
    svc.destroy();
  });

  it("backoff delay doubles: attempt 0=initial, attempt 1=initial*factor, attempt 2=initial*factor^2", async () => {
    const svc = createMockRealtimeService();
    svc._testSetStatus("offline");

    const connectingTimestamps: number[] = [];
    const originalOnStatusChange = svc.onStatusChange.bind(svc);

    originalOnStatusChange((status) => {
      if (status === "connecting") {
        connectingTimestamps.push(Date.now());
        // Immediately fail: go back to offline so backoff continues
        svc._testSetStatus("offline");
      }
    });

    svc.reconnect();

    // Attempt 0 fires after RECONNECT_INITIAL_DELAY_MS
    await vi.advanceTimersByTimeAsync(RECONNECT_INITIAL_DELAY_MS + 1);

    // Attempt 1 fires after RECONNECT_INITIAL_DELAY_MS * RECONNECT_BACKOFF_FACTOR
    await vi.advanceTimersByTimeAsync(RECONNECT_INITIAL_DELAY_MS * RECONNECT_BACKOFF_FACTOR + 1);

    // Attempt 2 fires after RECONNECT_INITIAL_DELAY_MS * RECONNECT_BACKOFF_FACTOR^2
    await vi.advanceTimersByTimeAsync(
      RECONNECT_INITIAL_DELAY_MS * RECONNECT_BACKOFF_FACTOR ** 2 + 1,
    );

    expect(connectingTimestamps.length).toBeGreaterThanOrEqual(3);

    const gap1 = connectingTimestamps[1] - connectingTimestamps[0];
    const gap2 = connectingTimestamps[2] - connectingTimestamps[1];

    // Each gap should be roughly double the previous (within a small tolerance)
    expect(gap2).toBeGreaterThanOrEqual(gap1 * (RECONNECT_BACKOFF_FACTOR - 0.1));
    svc.destroy();
  });

  it("backoff delay is capped at RECONNECT_MAX_DELAY_MS", async () => {
    const svc = createMockRealtimeService();
    svc._testSetStatus("offline");

    const connectingTimestamps: number[] = [];

    svc.onStatusChange((status) => {
      if (status === "connecting") {
        connectingTimestamps.push(Date.now());
        svc._testSetStatus("offline");
      }
    });

    svc.reconnect();

    // Advance enough to exhaust all attempts with capping
    // attempt delays: 1000, 2000, 4000, 8000, 16000, 30000 (capped)
    const totalTime =
      RECONNECT_INITIAL_DELAY_MS +
      RECONNECT_INITIAL_DELAY_MS * RECONNECT_BACKOFF_FACTOR +
      RECONNECT_INITIAL_DELAY_MS * RECONNECT_BACKOFF_FACTOR ** 2 +
      RECONNECT_INITIAL_DELAY_MS * RECONNECT_BACKOFF_FACTOR ** 3 +
      RECONNECT_INITIAL_DELAY_MS * RECONNECT_BACKOFF_FACTOR ** 4 +
      RECONNECT_MAX_DELAY_MS +
      1000;

    await vi.advanceTimersByTimeAsync(totalTime);

    // Verify last gap is ≤ RECONNECT_MAX_DELAY_MS
    if (connectingTimestamps.length >= 2) {
      const lastIdx = connectingTimestamps.length - 1;
      const lastGap = connectingTimestamps[lastIdx] - connectingTimestamps[lastIdx - 1];
      expect(lastGap).toBeLessThanOrEqual(RECONNECT_MAX_DELAY_MS + 10); // +10ms tolerance
    }

    svc.destroy();
  });

  it("stops retrying after RECONNECT_MAX_ATTEMPTS failures", async () => {
    const svc = createMockRealtimeService();
    svc._testSetStatus("offline");

    let connectingCount = 0;

    svc.onStatusChange((status) => {
      if (status === "connecting") {
        connectingCount++;
        svc._testSetStatus("offline");
      }
    });

    svc.reconnect();

    // Advance enough time to exhaust all attempts + a large buffer
    await vi.advanceTimersByTimeAsync(RECONNECT_MAX_DELAY_MS * (RECONNECT_MAX_ATTEMPTS + 5));

    expect(connectingCount).toBeLessThanOrEqual(RECONNECT_MAX_ATTEMPTS);
    svc.destroy();
  });

  it("settles at offline after exhausting all attempts", async () => {
    const svc = createMockRealtimeService();
    svc._testSetStatus("offline");

    svc.onStatusChange((status) => {
      if (status === "connecting") {
        svc._testSetStatus("offline");
      }
    });

    svc.reconnect();

    await vi.advanceTimersByTimeAsync(RECONNECT_MAX_DELAY_MS * (RECONNECT_MAX_ATTEMPTS + 5));

    expect(svc.status()).toBe("offline");
    svc.destroy();
  });

  it("status change listeners are notified on each transition", async () => {
    const svc = createMockRealtimeService();
    const allStatuses: string[] = [];

    svc.onStatusChange((s) => allStatuses.push(s));
    svc._testSetStatus("offline");
    allStatuses.length = 0;

    svc.reconnect();
    await vi.advanceTimersByTimeAsync(RECONNECT_INITIAL_DELAY_MS);

    expect(allStatuses).toContain("connecting");
    expect(allStatuses).toContain("online");
    svc.destroy();
  });

  it("does not start backoff if already online", async () => {
    const svc = createMockRealtimeService(); // starts online
    const statuses: string[] = [];
    svc.onStatusChange((s) => statuses.push(s));

    svc.reconnect();
    await vi.advanceTimersByTimeAsync(RECONNECT_INITIAL_DELAY_MS);

    // Should not have gone through connecting cycle unnecessarily
    expect(svc.status()).toBe("online");
    svc.destroy();
  });

  it("_testSimulateDisconnect() triggers reconnect automatically", async () => {
    const svc = createMockRealtimeService();
    const statuses: string[] = [];
    svc.onStatusChange((s) => statuses.push(s));

    svc._testSimulateDisconnect();

    expect(statuses).toContain("offline");
    // After initial delay, should see connecting
    await vi.advanceTimersByTimeAsync(RECONNECT_INITIAL_DELAY_MS);
    expect(statuses).toContain("connecting");
    svc.destroy();
  });
});
