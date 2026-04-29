// @vitest-environment node
//
// Integration test for the `for update skip locked` claim contract under
// concurrent invocation. Hits the LOCAL Supabase instance — gracefully skipped
// when it is not reachable (so CI / fresh checkouts don't fail).
// Runs under `node` (not the global `jsdom` default) because this is a
// TCP-bound integration test, not a DOM/component test.
//
// What this test asserts that the unit test (route.test.ts) cannot:
//   1. Each expirable row is claimed by exactly ONE worker (skip-locked correctness).
//   2. No deadlocks under 5-way concurrent contention against the same row set.
//   3. End-to-end throughput finishes within a generous bound (sanity upper limit).
//
// The route handler imports a real Supabase service-role client; we mock the
// factory only to bypass its `https://` guard and inject the local URL/key.
// Audit log + event bus are mocked because their behavior is covered by
// route.test.ts and would add unrelated DB churn here.

import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  cleanupIdentity,
  createLocalServiceRoleClient,
  isLocalSupabaseReachable,
  readOrderStatuses,
  seedIdentity,
  seedOrders,
  type ConcurrentTestClient,
} from "@/app/api/cron/_test-helpers/concurrent-fixtures";

const { mockAppend, mockPublish } = vi.hoisted(() => ({
  mockPublish: vi.fn(),
  mockAppend: vi.fn(),
}));

vi.mock("@/shared/config/env", () => ({
  env: {
    CRON_SECRET: "test-cron-secret-min-16",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    SUPABASE_SERVICE_ROLE_KEY: "local-service-role",
  },
}));

vi.mock("@/shared/repositories/supabase/client", async () => {
  const helpers = await import("@/app/api/cron/_test-helpers/concurrent-fixtures");
  return {
    // Production guard rejects http:// — bypass it for the local fixture URL.
    createServiceRoleClient: vi.fn(() => helpers.createLocalServiceRoleClient()),
  };
});

vi.mock("@/shared/repositories/supabase/audit-log.supabase", () => ({
  SupabaseAuditLogService: vi.fn(function () {
    return { append: mockAppend, findByOrderId: vi.fn() };
  }),
}));

vi.mock("@/shared/domain/event-bus", () => ({
  eventBus: {
    publish: mockPublish,
    subscribe: vi.fn(),
    registerSerializationHook: vi.fn(),
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { POST } from "./route";

const VALID_TOKEN = "Bearer test-cron-secret-min-16";
const PARALLEL_WORKERS = 5;
const TOTAL_ORDERS = 25; // 5 workers × 5 orders each as a fair-share baseline

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost/api/cron/expire-orders", {
    method: "POST",
    headers: { Authorization: VALID_TOKEN },
  });
}

// Top-level await: evaluated at module load so describe.skipIf has the answer
// before the suite is registered. Vitest supports ESM TLA in test files.
const supabaseAvailable = await isLocalSupabaseReachable();

describe.skipIf(!supabaseAvailable)("POST /api/cron/expire-orders — concurrent", () => {
  let testClient: ConcurrentTestClient;
  let identity: Awaited<ReturnType<typeof seedIdentity>>;
  let orderInternalIds: readonly number[];
  let orderPublicIds: readonly string[];

  beforeAll(async () => {
    testClient = createLocalServiceRoleClient();
    identity = await seedIdentity(testClient);
  }, 10_000);

  afterAll(async () => {
    await cleanupIdentity(testClient, identity);
  }, 10_000);

  beforeEach(async () => {
    mockAppend.mockReset();
    mockAppend.mockResolvedValue(undefined);
    mockPublish.mockReset();

    // Seed N orders 15min in the past — well past the 10min expiration boundary.
    const expirableCreatedAt = new Date(Date.now() - 15 * 60 * 1000);
    const seeded = await seedOrders({
      client: testClient,
      identity,
      count: TOTAL_ORDERS,
      status: "enviado",
      createdAt: expirableCreatedAt,
    });
    orderInternalIds = seeded.internalIds;
    orderPublicIds = seeded.publicIds;
  }, 15_000);

  afterEach(async () => {
    // Only clean orders for this run; identity (user/store) survives across
    // tests in the same file to amortize fixture setup cost.
    await testClient.from("orders").delete().eq("store_id", identity.storeId);
  }, 10_000);

  it("claims each row exactly once across 5 parallel workers (skip-locked correctness)", async () => {
    const responses = await Promise.all(
      Array.from({ length: PARALLEL_WORKERS }, () => POST(makeRequest())),
    );

    // 1. All workers returned 200.
    for (const res of responses) {
      expect(res.status).toBe(200);
    }

    const bodies = await Promise.all(responses.map((r) => r.json() as Promise<{ count: number }>));
    const totalClaimed = bodies.reduce((acc, b) => acc + b.count, 0);

    // 2. Aggregate `count` covers every seeded order (>= because the local DB
    //    may contain unrelated expirable orders from other test files).
    expect(totalClaimed).toBeGreaterThanOrEqual(TOTAL_ORDERS);

    // 3. All seeded orders are now `expirado` (single transition each, no
    //    rows left behind in `enviado`).
    const finalStatuses = await readOrderStatuses(testClient, orderInternalIds);
    expect(finalStatuses).toHaveLength(TOTAL_ORDERS);
    for (const status of finalStatuses) {
      expect(status).toBe("expirado");
    }

    // 4. Each of our orders fired exactly one ORDER_EXPIRED event — no
    //    duplicates means SKIP LOCKED truly partitioned the work.
    const ourPublishedEvents = mockPublish.mock.calls
      .map((args) => args[0] as { type: string; orderId: string })
      .filter((event) => event.type === "ORDER_EXPIRED" && orderPublicIds.includes(event.orderId));
    expect(ourPublishedEvents).toHaveLength(TOTAL_ORDERS);
    const orderIdsPublished = new Set(ourPublishedEvents.map((e) => e.orderId));
    expect(orderIdsPublished.size).toBe(TOTAL_ORDERS);
  }, 30_000);

  it("completes the 5-way concurrent claim within the throughput bound (no deadlocks)", async () => {
    const start = Date.now();
    const responses = await Promise.all(
      Array.from({ length: PARALLEL_WORKERS }, () => POST(makeRequest())),
    );
    const elapsedMs = Date.now() - start;

    // Postgres aborts deadlocks automatically — they surface as a 500 from
    // the RPC, never as a hung request. Asserting all 200s = no deadlock.
    for (const res of responses) {
      expect(res.status).toBe(200);
    }
    // 25 orders under 5-way concurrency finishes well under 10s on a healthy
    // local Supabase. Generous bound (20s) to avoid flakiness on slow CI hosts.
    expect(elapsedMs).toBeLessThan(20_000);
  }, 30_000);
});
