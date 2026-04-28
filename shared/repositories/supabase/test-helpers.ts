import { vi } from "vitest";
import type { SupabaseClient } from "./client";

export function createMockSupabaseClient() {
  const queryMock = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  };

  const fromMock = vi.fn().mockReturnValue(queryMock);
  const rpcMock = vi.fn();

  return {
    client: { from: fromMock, rpc: rpcMock } as unknown as SupabaseClient,
    queryMock,
    fromMock,
    rpcMock,
  };
}

/** Convenience: make single() resolve with data */
export function mockSingle<T>(
  queryMock: ReturnType<typeof createMockSupabaseClient>["queryMock"],
  data: T,
) {
  queryMock.single.mockResolvedValueOnce({ data, error: null });
}

/** Convenience: make maybeSingle() resolve with data (or null) */
export function mockMaybeSingle<T>(
  queryMock: ReturnType<typeof createMockSupabaseClient>["queryMock"],
  data: T | null,
) {
  queryMock.maybeSingle.mockResolvedValueOnce({ data, error: null });
}

/** Convenience: make a terminal method resolve with an array */
export function mockList<T>(
  queryMock: ReturnType<typeof createMockSupabaseClient>["queryMock"],
  data: T[],
) {
  // When no terminal method is called, the query itself resolves (from eq/order)
  const chain = {
    ...queryMock,
    then: (resolve: (v: { data: T[]; error: null }) => void) => resolve({ data, error: null }),
  };
  return chain;
}
