import * as Sentry from "@sentry/nextjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/shared/utils/logger";

vi.mock("@sentry/nextjs", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    registerErrorHook: vi.fn(),
  },
}));

describe("initSentryServer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not call Sentry.init when DSN is undefined", async () => {
    const { initSentryServer } = await import("./sentry.server.config");
    initSentryServer(undefined);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it("does not register error hook when DSN is undefined", async () => {
    const { initSentryServer } = await import("./sentry.server.config");
    initSentryServer(undefined);
    expect(logger.registerErrorHook).not.toHaveBeenCalled();
  });

  it("calls Sentry.init with the DSN when provided", async () => {
    const { initSentryServer } = await import("./sentry.server.config");
    const dsn = "https://key@o123.ingest.sentry.io/456";
    initSentryServer(dsn);
    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({ dsn }));
  });

  it("registers an error hook when DSN is provided", async () => {
    const { initSentryServer } = await import("./sentry.server.config");
    initSentryServer("https://key@o123.ingest.sentry.io/456");
    expect(logger.registerErrorHook).toHaveBeenCalledWith(expect.any(Function));
  });

  it("registered hook calls Sentry.captureException with an Error", async () => {
    const { initSentryServer } = await import("./sentry.server.config");
    initSentryServer("https://key@o123.ingest.sentry.io/456");

    const hook = vi.mocked(logger.registerErrorHook).mock.calls[0][0];
    hook("server error", { requestId: "r1" });

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ extra: { requestId: "r1" } }),
    );
  });
});
