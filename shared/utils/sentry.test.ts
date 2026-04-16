import * as Sentry from "@sentry/nextjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "./logger";
import { initSentry } from "./sentry";

vi.mock("@sentry/nextjs", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("./logger", () => ({
  logger: {
    registerErrorHook: vi.fn(),
  },
}));

describe("initSentry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not call Sentry.init when DSN is undefined", () => {
    initSentry(undefined);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it("does not register error hook when DSN is undefined", () => {
    initSentry(undefined);
    expect(logger.registerErrorHook).not.toHaveBeenCalled();
  });

  it("calls Sentry.init with the DSN when provided", () => {
    const dsn = "https://key@o123.ingest.sentry.io/456";
    initSentry(dsn);
    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({ dsn }));
  });

  it("registers an error hook when DSN is provided", () => {
    initSentry("https://key@o123.ingest.sentry.io/456");
    expect(logger.registerErrorHook).toHaveBeenCalledWith(expect.any(Function));
  });

  it("registered hook calls Sentry.captureException with an Error wrapping the message", () => {
    initSentry("https://key@o123.ingest.sentry.io/456");

    const hook = vi.mocked(logger.registerErrorHook).mock.calls[0][0];
    hook("something broke", { userId: "u1" });

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ extra: { userId: "u1" } }),
    );
  });
});
