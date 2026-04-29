// Shared seed/teardown helpers for cron concurrent integration tests.
// Underscore-prefixed folder is treated as private by Next.js App Router (not routed).
// Imported only from *.test.ts files; never bundled into runtime.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Local Supabase defaults — published JWTs from `supabase start`. Safe to commit:
// only valid against a CLI-managed local instance, never against any cloud project.
export const LOCAL_SUPABASE_URL = "http://127.0.0.1:54321";
export const LOCAL_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

export type ConcurrentTestClient = SupabaseClient;

export function createLocalServiceRoleClient(): ConcurrentTestClient {
  return createClient(LOCAL_SUPABASE_URL, LOCAL_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Pings PostgREST root with a 1.5s timeout. Tests use this at module load to
// gracefully skip when local Supabase isn't running, instead of failing CI.
// PostgREST returns 200 on /rest/v1/ when healthy. Connection errors = down.
// Why /rest/v1/ and not /auth/v1/health: the auth container is flakier on cold
// restart and intermittently returns 502 through Kong even when REST is fine.
export async function isLocalSupabaseReachable(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(`${LOCAL_SUPABASE_URL}/rest/v1/`, {
      method: "GET",
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

interface SeededIdentity {
  readonly userId: number; // bigint, surfaced as number from PostgREST
  readonly storeId: number;
  readonly testRunId: string; // unique marker — used for cleanup filter
}

// Creates one customer + one store with a unique marker for the duration of a
// test file. Each concurrent test file owns its own pair so parallel test files
// don't fight for the same fixture rows.
export async function seedIdentity(client: ConcurrentTestClient): Promise<SeededIdentity> {
  const testRunId = crypto.randomUUID();
  const authUserId = crypto.randomUUID();

  const { data: userRow, error: userErr } = await client
    .from("users")
    .insert({
      auth_user_id: authUserId,
      role: "cliente",
      display_name: `concurrent-test-${testRunId}`,
    })
    .select("id")
    .single();
  if (userErr !== null || userRow === null) {
    throw new Error(`seedIdentity: insert user failed — ${userErr?.message ?? "no row"}`);
  }

  const { data: storeRow, error: storeErr } = await client
    .from("stores")
    .insert({
      owner_id: userRow.id,
      name: `concurrent-test-store-${testRunId}`,
      available: false,
    })
    .select("id")
    .single();
  if (storeErr !== null || storeRow === null) {
    throw new Error(`seedIdentity: insert store failed — ${storeErr?.message ?? "no row"}`);
  }

  return { userId: userRow.id, storeId: storeRow.id, testRunId };
}

interface SeedOrdersInput {
  readonly client: ConcurrentTestClient;
  readonly identity: SeededIdentity;
  readonly count: number;
  readonly status: "enviado" | "aceptado";
  readonly createdAt: Date;
  // Only used for status='aceptado': simulates an old accepted_at via updated_at.
  // The trg_orders_updated_at trigger fires only on UPDATE — INSERT preserves
  // the value passed here.
  readonly updatedAt?: Date;
}

interface SeededOrders {
  readonly publicIds: readonly string[];
  readonly internalIds: readonly number[];
}

export async function seedOrders({
  client,
  identity,
  count,
  status,
  createdAt,
  updatedAt,
}: SeedOrdersInput): Promise<SeededOrders> {
  const rows = Array.from({ length: count }, () => ({
    customer_id: identity.userId,
    store_id: identity.storeId,
    status,
    created_at: createdAt.toISOString(),
    updated_at: (updatedAt ?? createdAt).toISOString(),
  }));

  const { data, error } = await client.from("orders").insert(rows).select("id, public_id");

  if (error !== null || data === null) {
    throw new Error(`seedOrders: insert failed — ${error?.message ?? "no rows"}`);
  }

  return {
    publicIds: data.map((r) => r.public_id as string),
    internalIds: data.map((r) => r.id as number),
  };
}

// Clean every row owned by the test identity. Order matters: orders → store → user.
export async function cleanupIdentity(
  client: ConcurrentTestClient,
  identity: SeededIdentity,
): Promise<void> {
  await client
    .from("audit_log")
    .delete()
    .eq("table_name", "orders")
    .in(
      "row_id",
      (await client.from("orders").select("id").eq("store_id", identity.storeId)).data?.map(
        (r) => r.id as number,
      ) ?? [],
    );
  await client.from("orders").delete().eq("store_id", identity.storeId);
  await client.from("stores").delete().eq("id", identity.storeId);
  await client.from("users").delete().eq("id", identity.userId);
}

// Read final status of the test's own orders — used to assert post-conditions.
export async function readOrderStatuses(
  client: ConcurrentTestClient,
  internalIds: readonly number[],
): Promise<readonly string[]> {
  if (internalIds.length === 0) return [];
  const { data, error } = await client
    .from("orders")
    .select("status")
    .in("id", [...internalIds]);
  if (error !== null || data === null) {
    throw new Error(`readOrderStatuses: select failed — ${error?.message ?? "no rows"}`);
  }
  return data.map((r) => r.status as string);
}
