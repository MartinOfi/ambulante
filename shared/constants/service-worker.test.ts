import { describe, it, expect } from "vitest";
import { SW_MESSAGE_TYPE, SW_UPDATE_CHECK_INTERVAL_MS, SW_UPDATE_STATUS } from "./service-worker";

describe("SW_MESSAGE_TYPE", () => {
  it("contains SKIP_WAITING", () => {
    expect(SW_MESSAGE_TYPE.SKIP_WAITING).toBe("SKIP_WAITING");
  });

  it("is frozen (immutable)", () => {
    expect(Object.isFrozen(SW_MESSAGE_TYPE)).toBe(true);
  });
});

describe("SW_UPDATE_STATUS", () => {
  it("contains all four states", () => {
    expect(SW_UPDATE_STATUS.IDLE).toBe("idle");
    expect(SW_UPDATE_STATUS.AVAILABLE).toBe("available");
    expect(SW_UPDATE_STATUS.DISMISSED).toBe("dismissed");
    expect(SW_UPDATE_STATUS.APPLYING).toBe("applying");
  });

  it("is frozen (immutable)", () => {
    expect(Object.isFrozen(SW_UPDATE_STATUS)).toBe(true);
  });

  it("has exactly four states", () => {
    expect(Object.keys(SW_UPDATE_STATUS)).toHaveLength(4);
  });
});

describe("SW_UPDATE_CHECK_INTERVAL_MS", () => {
  it("is exactly 1 hour in milliseconds", () => {
    expect(SW_UPDATE_CHECK_INTERVAL_MS).toBe(3_600_000);
  });

  it("is a positive number", () => {
    expect(SW_UPDATE_CHECK_INTERVAL_MS).toBeGreaterThan(0);
  });
});
