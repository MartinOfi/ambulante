// @vitest-environment node
//
// Integration test for the `for update skip locked` claim contract under
// concurrent invocation — auto-close variant. Mirrors the expire-orders
// concurrent test in structure; differs in the seeded order shape (status
// `aceptado` with an old `updated_at` proxying for accepted_at) and in the
// expected post-state (`finalizado`).
// Runs under `node` (not the global `jsdom` default) because this is a
// TCP-bound integration test, not a DOM/component test.

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
const TOTAL_ORDERS = 25;

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost/api/cron/auto-close-orders", {
    method: "POST",
    headers: { Authorization: VALID_TOKEN },
  });
}

const supabaseAvailable = await isLocalSupabaseReachable();

describe.skipIf(!supabaseAvailable)("POST /api/cron/auto-close-orders — concurrent", () => {
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

    // status='aceptado' with updated_at 2.5h in the past — well past the 2h
    // auto-close boundary. The trg_orders_updated_at trigger fires only on
    // UPDATE, so the inserted updated_at is preserved verbatim.
    const sentAt = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const acceptedAt = new Date(Date.now() - 2.5 * 60 * 60 * 1000);
    const seeded = await seedOrders({
      client: testClient,
      identity,
      count: TOTAL_ORDERS,
      status: "aceptado",
      createdAt: sentAt,
      updatedAt: acceptedAt,
    });
    orderInternalIds = seeded.internalIds;
    orderPublicIds = seeded.publicIds;
  }, 15_000);

  afterEach(async () => {
    await testClient.from("orders").delete().eq("store_id", identity.storeId);
  }, 10_000);

  it("auto-closes each row exactly once across 5 parallel workers (skip-locked correctness)", async () => {
    const responses = await Promise.all(
      Array.from({ length: PARALLEL_WORKERS }, () => POST(makeRequest())),
    );

    for (const res of responses) {
      expect(res.status).toBe(200);
    }

    const bodies = await Promise.all(responses.map((r) => r.json() as Promise<{ count: number }>));
    const totalClaimed = bodies.reduce((acc, b) => acc + b.count, 0);

    // Aggregate covers every seeded order (>= for shared-DB tolerance).
    expect(totalClaimed).toBeGreaterThanOrEqual(TOTAL_ORDERS);

    const finalStatuses = await readOrderStatuses(testClient, orderInternalIds);
    expect(finalStatuses).toHaveLength(TOTAL_ORDERS);
    for (const status of finalStatuses) {
      expect(status).toBe("finalizado");
    }

    const ourPublishedEvents = mockPublish.mock.calls
      .map((args) => args[0] as { type: string; orderId: string })
      .filter((event) => event.type === "ORDER_FINISHED" && orderPublicIds.includes(event.orderId));
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

    for (const res of responses) {
      expect(res.status).toBe(200);
    }
    expect(elapsedMs).toBeLessThan(20_000);
  }, 30_000);
});
