import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/utils/sentry", () => ({
  initSentry: vi.fn(),
}));

describe("sentry.server.config", () => {
  it("re-exports initSentry as initSentryServer", async () => {
    const mod = await import("./sentry.server.config");
    expect(typeof mod.initSentryServer).toBe("function");
  });
});
