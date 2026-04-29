import { type NextRequest, NextResponse } from "next/server";
import { RATE_LIMIT_RULES } from "@/shared/constants/rate-limit";
import { REQUEST_ID_HEADER } from "@/shared/constants/observability";
import { getRequiredRole } from "@/shared/utils/route-access";
import { ROUTES } from "@/shared/constants/routes";
import { createRateLimitService } from "@/shared/services/rate-limit";
import { createMiddlewareClient } from "@/shared/repositories/supabase/client";
import { readOrCreateRequestId } from "@/shared/utils/request-id";
import { userRoleSchema } from "@/shared/schemas/user";

const rateLimiter = createRateLimitService();

function tagWithRequestId(response: NextResponse, requestId: string): NextResponse {
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

// x-real-ip is set by Vercel's reverse proxy and cannot be forged by the client.
// x-forwarded-for rightmost entry is the one appended by the trusted proxy.
function extractIp(request: NextRequest): string | null {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const entries = forwarded.split(",");
    return entries[entries.length - 1]?.trim() ?? null;
  }

  return null;
}

// Rate limiting applies only to /api/* routes.
async function applyRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return null;
  }

  const ip = extractIp(request);
  if (!ip) {
    return NextResponse.json(
      { error: "No se pudo identificar el origen de la solicitud." },
      { status: 400 },
    );
  }

  const rule = pathname.startsWith("/api/orders") ? RATE_LIMIT_RULES.orders : RATE_LIMIT_RULES.api;
  const result = await rateLimiter.check({ identifier: ip, rule });

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intentá de nuevo en unos momentos." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetAtMs - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(rule.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetAtMs),
        },
      },
    );
  }

  return null;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const requestId = readOrCreateRequestId(request.headers);

  // Forward the id to downstream handlers via mutated request headers (Next.js
  // recomposes the request from the headers passed in NextResponse.next).
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set(REQUEST_ID_HEADER, requestId);

  const rateLimitResponse = await applyRateLimit(request);
  if (rateLimitResponse) return tagWithRequestId(rateLimitResponse, requestId);

  // Create response first so Supabase can write refreshed session cookies into it.
  const response = NextResponse.next({ request: { headers: forwardedHeaders } });
  const supabase = createMiddlewareClient(request, response);

  // getUser() validates the JWT server-side on every request — cannot be forged.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const requiredRole = getRequiredRole(pathname);

  if (!requiredRole) {
    return tagWithRequestId(response, requestId);
  }

  if (!user) {
    return tagWithRequestId(
      NextResponse.redirect(new URL(ROUTES.auth.login, request.url)),
      requestId,
    );
  }

  const { data: appUser } = await supabase.from("users").select("role").eq("id", user.id).single();

  const roleResult = userRoleSchema.safeParse(appUser?.role);
  if (!roleResult.success || roleResult.data !== requiredRole) {
    return tagWithRequestId(
      NextResponse.redirect(new URL(ROUTES.public.home, request.url)),
      requestId,
    );
  }

  return tagWithRequestId(response, requestId);
}

// Next.js static analysis requires literal values in config.matcher — no identifier references.
export const config = {
  matcher: [
    "/api/:path*",
    "/map/:path*",
    "/orders/:path*",
    "/profile/:path*",
    "/store/:path*",
    "/admin/:path*",
  ],
};
