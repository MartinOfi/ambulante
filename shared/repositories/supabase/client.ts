import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

// Browser-safe exports (no next/headers dependency) — re-exported for callers
// that import everything from this file. Client Components must import directly
// from ./client.browser to avoid next/headers contamination.
export type { SupabaseClient } from "./client.browser";
export { createBrowserClient, createServiceRoleClient } from "./client.browser";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`${name} is not set`);
  return value.trim();
}

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
              // httpOnly omitted: @supabase/ssr browser client reads auth cookies via
              // document.cookie — marking them httpOnly makes the session invisible to JS.
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
