import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export function createBrowserClient(url?: string, anonKey?: string) {
  // Must use literal dot-notation so webpack can statically inline these values
  // in the client bundle. process.env[variableName] (bracket notation) resolves
  // to undefined in the browser even when the NEXT_PUBLIC_ var is set.
  const resolvedUrl = url ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const resolvedAnonKey = anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!resolvedUrl?.trim()) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!resolvedAnonKey?.trim()) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  return createSupabaseBrowserClient(resolvedUrl.trim(), resolvedAnonKey.trim(), {
    auth: {
      // navigator.locks.request() hangs in headless Chromium when storageState
      // pre-loads auth tokens (E2E). No-op lock is safe for single-tab use.
      lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> =>
        fn(),
    },
  });
}

// Repositories accept any Supabase client variant (browser, server, route handler).
export type SupabaseClient = ReturnType<typeof createBrowserClient>;

// Cron route handlers use service role to bypass RLS. Never pass this client to
// user-facing code — it has full DB access with no row-level restrictions.
export function createServiceRoleClient(url: string, key: string): SupabaseClient {
  const isLocalDev = url.startsWith("http://127.") || url.startsWith("http://localhost");
  const hasValidProtocol = url.startsWith("https://") || isLocalDev;
  if (!hasValidProtocol || key.trim().length === 0) {
    throw new Error("createServiceRoleClient: invalid url or key");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
