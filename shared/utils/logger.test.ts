import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// We test the module in isolation by mocking env before import.
// Each describe block re-imports the module with a fresh env to test
// dev vs prod behavior without relying on process.env at module load time.

describe("Logger — development transport", () => {
  const consoleSpy = {
    debug: vi.spyOn(console, "debug").mockImplementation(() => undefined),
    info: vi.spyOn(console, "info").mockImplementation(() => undefined),
    warn: vi.spyOn(console, "warn").mockImplementation(() => undefined),
    error: vi.spyOn(console, "error").mockImplementation(() => undefined),
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("forwards debug calls to console.debug with message", async () => {
    const { createLogger } = await import("./logger");
    const logger = createLogger("development");
    logger.debug("test debug message");
    expect(consoleSpy.debug).toHaveBeenCalledWith(
      "[DEBUG]",
      "test debug message",
      undefined,
    );
  });

  it("forwards info calls to console.info with context", async () => {
    const { createLogger } = await import("./logger");
    const logger = createLogger("development");
    logger.info("user logged in", { userId: "123" });
    expect(consoleSpy.info).toHaveBeenCalledWith("[INFO]", "user logged in", {
      userId: "123",
    });
  });

  it("forwards warn calls to console.warn", async () => {
    const { createLogger } = await import("./logger");
    const logger = createLogger("development");
    logger.warn("slow response", { durationMs: 2000 });
    expect(consoleSpy.warn).toHaveBeenCalledWith("[WARN]", "slow response", {
      durationMs: 2000,
    });
  });

  it("forwards error calls to console.error", async () => {
    const { createLogger } = await import("./logger");
    const logger = createLogger("development");
    const cause = new Error("original cause");
    logger.error("something broke", { cause });
    expect(consoleSpy.error).toHaveBeenCalledWith(
      "[ERROR]",
      "something broke",
      { cause },
    );
  });
});

describe("Logger — production transport", () => {
  const consoleSpy = {
    debug: vi.spyOn(console, "debug").mockImplementation(() => undefined),
    info: vi.spyOn(console, "info").mockImplementation(() => undefined),
    warn: vi.spyOn(console, "warn").mockImplementation(() => undefined),
    error: vi.spyOn(console, "error").mockImplementation(() => undefined),
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does NOT call console.debug in production", async () => {
    const { createLogger } = await import("./logger");
    const logger = createLogger("production");
    logger.debug("silent debug");
    expect(consoleSpy.debug).not.toHaveBeenCalled();
  });

  it("does NOT call console.info in production", async () => {
    const { createLogger } = await import("./logger");
    const logger = createLogger("production");
    logger.info("silent info");
    expect(consoleSpy.info).not.toHaveBeenCalled();
  });

  it("does NOT call console.warn in production", async () => {
    const { createLogger } = await import("./logger");
    const logger = createLogger("production");
    logger.warn("silent warn");
    expect(consoleSpy.warn).not.toHaveBeenCalled();
  });

  it("calls the registered error hook in production", async () => {
    const { createLogger } = await import("./logger");
    const logger = createLogger("production");
    const errorHook = vi.fn();
    logger.registerErrorHook(errorHook);
    logger.error("prod error", { code: 500 });
    expect(errorHook).toHaveBeenCalledWith("prod error", { code: 500 });
  });

  it("does NOT call console.error in production even for errors", async () => {
    const { createLogger } = await import("./logger");
    const logger = createLogger("production");
    logger.registerErrorHook(vi.fn());
    logger.error("silent console in prod");
    expect(consoleSpy.error).not.toHaveBeenCalled();
  });
});

describe("Logger — singleton export", () => {
  it("exports a default logger instance", async () => {
    const { logger } = await import("./logger");
    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.registerErrorHook).toBe("function");
  });
});
