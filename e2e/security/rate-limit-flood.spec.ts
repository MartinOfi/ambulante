import { expect, test } from "@playwright/test";

const FLOOD_REQUESTS = 80;
const TARGET_PATH = "/api/__rate_limit_probe";
const FAKE_IP = "203.0.113.7";

test.describe("security smoke — rate limit", () => {
  test("middleware returns 429 with Retry-After after burst on /api/*", async ({ request }) => {
    const responses = await Promise.all(
      Array.from({ length: FLOOD_REQUESTS }).map(() =>
        request.fetch(TARGET_PATH, { headers: { "x-real-ip": FAKE_IP } }),
      ),
    );

    const blocked = responses.filter((response) => response.status() === 429);
    expect(blocked.length).toBeGreaterThan(0);

    const sample = blocked[0];
    if (!sample) throw new Error("no blocked response captured");

    expect(sample.headers()["retry-after"]).toBeDefined();
    expect(sample.headers()["x-ratelimit-limit"]).toBeDefined();
    expect(sample.headers()["x-ratelimit-remaining"]).toBe("0");
    expect(sample.headers()["x-ratelimit-reset"]).toBeDefined();
  });

  test("rate limit body never leaks stack traces or env names", async ({ request }) => {
    const responses = await Promise.all(
      Array.from({ length: FLOOD_REQUESTS }).map(() =>
        request.fetch(TARGET_PATH, { headers: { "x-real-ip": "203.0.113.8" } }),
      ),
    );

    const blocked = responses.find((response) => response.status() === 429);
    expect(blocked).toBeDefined();
    if (!blocked) return;

    const text = await blocked.text();
    expect(text.toLowerCase()).not.toContain("stack");
    expect(text).not.toContain("at /");
    expect(text).not.toContain("SUPABASE_");
    expect(text).not.toContain("CRON_SECRET");
  });
});
