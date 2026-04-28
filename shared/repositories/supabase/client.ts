import {
  createBrowserClient as createSupabaseBrowserClient,
  createServerClient as createSupabaseServerClient,
} from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  (() => {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  })();
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  (() => {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  })();

export function createBrowserClient() {
  return createSupabaseBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Repositories accept any Supabase client variant (browser, server, route handler).
export type SupabaseClient = ReturnType<typeof createBrowserClient>;

// Server Components: cookies() is read-only — setAll wraps in try/catch so
// getUser() doesn't throw. Middleware handles session refresh on the next request.
export async function createServerClient() {
  const cookieStore = await cookies();
  return createSupabaseServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Read-only in Server Component context — session refresh deferred to middleware.
        }
      },
    },
  });
}

// Route Handlers allow cookie writes — no try/catch needed unlike createServerClient.
export async function createRouteHandlerClient() {
  const cookieStore = await cookies();
  return createSupabaseServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Merge hardened defaults so any future cookie written here is secure by default.
        // SDK-supplied options take precedence (spread last) to preserve expiry and path.
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
  });
}

// Used in middleware.ts — both request and response are needed to read and
// write refreshed session cookies across the request/response cycle.
export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createSupabaseServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
  });
}
