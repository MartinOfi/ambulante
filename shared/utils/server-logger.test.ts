// @vitest-environment node
// Why node environment: server-logger imports server-only and pino, which are Node.js-only.
// jsdom (default) does not support the Node.js crypto and stream APIs required by pino.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// We must mock pino before importing server-logger to intercept pino construction.
const mockChildLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const mockPinoInstance = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(() => mockChildLogger),
};

vi.mock("pino", () => ({
  default: vi.fn(() => mockPinoInstance),
}));

describe("generateRequestId", () => {
  it("returns a non-empty string", async () => {
    const { generateRequestId } = await import("./server-logger");
    const requestId = generateRequestId();
    expect(typeof requestId).toBe("string");
    expect(requestId.length).toBeGreaterThan(0);
  });

  it("returns a UUID-shaped string", async () => {
    const { generateRequestId } = await import("./server-logger");
    const requestId = generateRequestId();
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(requestId).toMatch(uuidPattern);
  });

  it("generates unique ids on each call", async () => {
    const { generateRequestId } = await import("./server-logger");
    const firstId = generateRequestId();
    const secondId = generateRequestId();
    expect(firstId).not.toBe(secondId);
  });
});

describe("createRequestLogger — Logger interface compliance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns an object with all required Logger methods", async () => {
    const { createRequestLogger } = await import("./server-logger");
    const requestLogger = createRequestLogger("req-test-123");
    expect(typeof requestLogger.debug).toBe("function");
    expect(typeof requestLogger.info).toBe("function");
    expect(typeof requestLogger.warn).toBe("function");
    expect(typeof requestLogger.error).toBe("function");
    expect(typeof requestLogger.registerErrorHook).toBe("function");
  });

  it("creates a child logger with the requestId binding", async () => {
    const { createRequestLogger } = await import("./server-logger");
    createRequestLogger("req-abc-456");
    expect(mockPinoInstance.child).toHaveBeenCalledWith({ requestId: "req-abc-456" });
  });

  it("delegates debug calls to pino child logger", async () => {
    const { createRequestLogger } = await import("./server-logger");
    const requestLogger = createRequestLogger("req-001");
    requestLogger.debug("test debug", { key: "value" });
    expect(mockChildLogger.debug).toHaveBeenCalledWith({ key: "value" }, "test debug");
  });

  it("delegates info calls to pino child logger", async () => {
    const { createRequestLogger } = await import("./server-logger");
    const requestLogger = createRequestLogger("req-001");
    requestLogger.info("user action", { userId: "u-123" });
    expect(mockChildLogger.info).toHaveBeenCalledWith({ userId: "u-123" }, "user action");
  });

  it("delegates warn calls to pino child logger", async () => {
    const { createRequestLogger } = await import("./server-logger");
    const requestLogger = createRequestLogger("req-001");
    requestLogger.warn("slow response", { durationMs: 2500 });
    expect(mockChildLogger.warn).toHaveBeenCalledWith({ durationMs: 2500 }, "slow response");
  });

  it("delegates error calls to pino child logger", async () => {
    const { createRequestLogger } = await import("./server-logger");
    const requestLogger = createRequestLogger("req-001");
    requestLogger.error("handler failed", { statusCode: 500 });
    expect(mockChildLogger.error).toHaveBeenCalledWith({ statusCode: 500 }, "handler failed");
  });

  it("calls error hook when registered and error is called", async () => {
    const { createRequestLogger } = await import("./server-logger");
    const requestLogger = createRequestLogger("req-001");
    const errorHook = vi.fn();
    requestLogger.registerErrorHook(errorHook);
    requestLogger.error("something broke", { code: "E_TIMEOUT" });
    expect(errorHook).toHaveBeenCalledWith("something broke", { code: "E_TIMEOUT" });
  });

  it("does not throw when error hook is not registered", async () => {
    const { createRequestLogger } = await import("./server-logger");
    const requestLogger = createRequestLogger("req-001");
    expect(() => requestLogger.error("no hook")).not.toThrow();
  });

  it("handles calls without context (context is optional)", async () => {
    const { createRequestLogger } = await import("./server-logger");
    const requestLogger = createRequestLogger("req-001");
    expect(() => requestLogger.info("message without context")).not.toThrow();
    expect(mockChildLogger.info).toHaveBeenCalledWith({}, "message without context");
  });
});

describe("serverLogger — singleton", () => {
  it("exports a serverLogger instance", async () => {
    const { serverLogger } = await import("./server-logger");
    expect(serverLogger).toBeDefined();
    expect(typeof serverLogger.debug).toBe("function");
    expect(typeof serverLogger.info).toBe("function");
    expect(typeof serverLogger.warn).toBe("function");
    expect(typeof serverLogger.error).toBe("function");
    expect(typeof serverLogger.registerErrorHook).toBe("function");
  });

  it("serverLogger delegates to the pino base instance", async () => {
    vi.clearAllMocks();
    const { serverLogger } = await import("./server-logger");
    serverLogger.info("startup event", { phase: "boot" });
    expect(mockPinoInstance.info).toHaveBeenCalledWith({ phase: "boot" }, "startup event");
  });
});
