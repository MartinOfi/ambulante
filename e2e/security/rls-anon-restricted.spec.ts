import { expect, test } from "@playwright/test";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const RESTRICTED_TABLES: ReadonlyArray<string> = [
  "orders",
  "order_items",
  "audit_log",
  "push_subscriptions",
  "rate_limit_buckets",
];

test.describe("security smoke — RLS anon restrictions", () => {
  test.skip(!SUPABASE_URL || !ANON_KEY, "Supabase env not configured — skipping RLS smoke");

  for (const table of RESTRICTED_TABLES) {
    test(`anon SELECT on ${table} returns empty or error, never leaks rows`, async ({
      request,
    }) => {
      const response = await request.get(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
        headers: {
          apikey: ANON_KEY ?? "",
          Authorization: `Bearer ${ANON_KEY ?? ""}`,
        },
      });

      if (!response.ok()) {
        expect(response.status()).toBeGreaterThanOrEqual(400);
        return;
      }

      const body = (await response.json()) as ReadonlyArray<unknown>;
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(0);
    });

    test(`anon INSERT on ${table} fails`, async ({ request }) => {
      const response = await request.post(`${SUPABASE_URL}/rest/v1/${table}`, {
        headers: {
          apikey: ANON_KEY ?? "",
          Authorization: `Bearer ${ANON_KEY ?? ""}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        data: { dummy: "value" },
      });

      expect(response.ok()).toBe(false);
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  }
});
