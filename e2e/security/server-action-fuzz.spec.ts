import { expect, test } from "@playwright/test";

const SUBSCRIBE_PATH = "/api/push/subscribe";
const UNSUBSCRIBE_PATH = "/api/push/unsubscribe";
const CRON_PATH = "/api/cron/expire-orders";

const FUZZ_PAYLOADS: ReadonlyArray<unknown> = [
  null,
  "",
  "<script>alert(1)</script>",
  { endpoint: "javascript:alert(1)", keys: { p256dh: "x", auth: "x" } },
  { endpoint: "https://example.com", keys: null },
  { endpoint: "https://example.com", keys: { p256dh: "", auth: "" } },
  { endpoint: 42, keys: { p256dh: 1, auth: 1 } },
  { endpoint: "'; DROP TABLE push_subscriptions; --", keys: { p256dh: "x", auth: "x" } },
  Array.from({ length: 1000 }).fill("a").join(""),
  {
    endpoint: "https://example.com",
    keys: { p256dh: "x", auth: "x" },
    userAgent: "x".repeat(10_000),
  },
];

function uniqueIp(prefix: string, index: number): string {
  return `198.51.100.${(index % 200) + 10}-${prefix}`;
}

test.describe("security smoke — server action fuzz", () => {
  test("push/subscribe rejects malformed payloads with 4xx, never 5xx", async ({ request }) => {
    for (const [index, payload] of FUZZ_PAYLOADS.entries()) {
      const response = await request.post(SUBSCRIBE_PATH, {
        data: payload as Record<string, unknown> | string,
        headers: { "x-real-ip": uniqueIp("sub", index), "Content-Type": "application/json" },
      });

      expect(response.status(), `payload index ${index}`).toBeGreaterThanOrEqual(400);
      expect(response.status(), `payload index ${index}`).toBeLessThan(500);

      const body = await response.text();
      expect(body.toLowerCase(), `payload index ${index}`).not.toContain("stack");
      expect(body, `payload index ${index}`).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
      expect(body, `payload index ${index}`).not.toContain("CRON_SECRET");
    }
  });

  test("push/unsubscribe rejects malformed payloads with 4xx", async ({ request }) => {
    for (const [index, payload] of FUZZ_PAYLOADS.entries()) {
      const response = await request.post(UNSUBSCRIBE_PATH, {
        data: payload as Record<string, unknown> | string,
        headers: { "x-real-ip": uniqueIp("uns", index), "Content-Type": "application/json" },
      });

      expect(response.status(), `payload index ${index}`).toBeGreaterThanOrEqual(400);
      expect(response.status(), `payload index ${index}`).toBeLessThan(500);
    }
  });

  test("cron endpoint rejects unauthorized callers without leaking", async ({ request }) => {
    const probes: ReadonlyArray<{ readonly headers: Record<string, string> }> = [
      { headers: { "x-real-ip": "198.51.100.21" } },
      { headers: { "x-real-ip": "198.51.100.22", Authorization: "Bearer wrong-secret" } },
      { headers: { "x-real-ip": "198.51.100.23", Authorization: "Basic admin:admin" } },
    ];

    for (const probe of probes) {
      const response = await request.post(CRON_PATH, probe);
      expect([401, 503]).toContain(response.status());

      const body = await response.text();
      expect(body).not.toContain("CRON_SECRET");
      expect(body).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
      expect(body.toLowerCase()).not.toContain("stack");
    }
  });
});
