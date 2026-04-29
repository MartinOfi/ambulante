import {
  createBrowserClient as createSupabaseBrowserClient,
  createServerClient as createSupabaseServerClient,
} from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`${name} is not set`);
  return value.trim();
}

export function createBrowserClient() {
  return createSupabaseBrowserClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}

// Repositories accept any Supabase client variant (browser, server, route handler).
export type SupabaseClient = ReturnType<typeof createBrowserClient>;

// Server Components: cookies() is read-only — setAll wraps in try/catch so
// getUser() doesn't throw. Middleware handles session refresh on the next request.
export async function createServerClient() {
  const cookieStore = await cookies();
  return createSupabaseServerClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Read-only in Server Component context — session refresh deferred to middleware.
          }
        },
      },
    },
  );
}

// Route Handlers allow cookie writes — no try/catch needed unlike createServerClient.
export async function createRouteHandlerClient() {
  const cookieStore = await cookies();
  return createSupabaseServerClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          const secure = process.env.NODE_ENV === "production";
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              httpOnly: true,
              secure,
              sameSite: "lax",
              path: "/",
              ...options,
            }),
          );
        },
      },
    },
  );
}

// Cron route handlers use service role to bypass RLS. Never pass this client to
// user-facing code — it has full DB access with no row-level restrictions.
export function createServiceRoleClient(url: string, key: string): SupabaseClient {
  if (!url.startsWith("https://") || key.trim().length === 0) {
    throw new Error("createServiceRoleClient: invalid url or key");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Used in middleware.ts — both request and response are needed to read and
// write refreshed session cookies across the request/response cycle.
export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createSupabaseServerClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          const secure = process.env.NODE_ENV === "production";
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              httpOnly: true,
              secure,
              sameSite: "lax",
              path: "/",
              ...options,
            }),
          );
        },
      },
    },
  );
}
