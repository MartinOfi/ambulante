import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/utils/sentry", () => ({
  initSentry: vi.fn(),
}));

describe("sentry.client.config", () => {
  it("re-exports initSentry as initSentryClient", async () => {
    const mod = await import("./sentry.client.config");
    expect(typeof mod.initSentryClient).toBe("function");
  });
});
