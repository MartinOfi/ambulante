import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/shared/repositories/supabase/client", () => ({
  createServiceRoleClient: vi.fn(() => ({ rpc: vi.fn() })),
}));

import { createRateLimiterFromEnv } from "./rate-limit.factory";
import { InMemoryRateLimiter } from "./rate-limit";
import { SupabaseRateLimiter } from "./rate-limit.supabase";
import { createServiceRoleClient } from "@/shared/repositories/supabase/client";

const ORIGINAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ORIGINAL_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function setEnv(url: string | undefined, key: string | undefined): void {
  if (url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = url;
  if (key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = key;
}

describe("createRateLimiterFromEnv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setEnv(ORIGINAL_URL, ORIGINAL_KEY);
  });

  it("returns InMemoryRateLimiter when supabase env is missing", () => {
    setEnv(undefined, undefined);
    const limiter = createRateLimiterFromEnv();
    expect(limiter).toBeInstanceOf(InMemoryRateLimiter);
    expect(createServiceRoleClient).not.toHaveBeenCalled();
  });

  it("returns InMemoryRateLimiter when only URL is set", () => {
    setEnv("https://example.supabase.co", undefined);
    const limiter = createRateLimiterFromEnv();
    expect(limiter).toBeInstanceOf(InMemoryRateLimiter);
  });

  it("returns InMemoryRateLimiter when only service role key is set", () => {
    setEnv(undefined, "service-key");
    const limiter = createRateLimiterFromEnv();
    expect(limiter).toBeInstanceOf(InMemoryRateLimiter);
  });

  it("returns SupabaseRateLimiter when both env vars are set", () => {
    setEnv("https://example.supabase.co", "service-key");
    const limiter = createRateLimiterFromEnv();
    expect(limiter).toBeInstanceOf(SupabaseRateLimiter);
    expect(createServiceRoleClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-key",
    );
  });
});
