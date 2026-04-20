import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/shared/constants/auth";
import { RATE_LIMIT_RULES } from "@/shared/constants/rate-limit";
import { parseSessionCookie } from "@/shared/utils/session-cookie";
import { getRequiredRole } from "@/shared/utils/route-access";
import { ROUTES } from "@/shared/constants/routes";
import { createRateLimitService } from "@/shared/services/rate-limit";

const rateLimiter = createRateLimitService();

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
// Non-API routes (map, orders, profile, store, admin) pass through to auth middleware below.
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
  const rateLimitResponse = await applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { pathname } = request.nextUrl;
  const requiredRole = getRequiredRole(pathname);

  if (!requiredRole) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = cookieValue ? parseSessionCookie(cookieValue) : null;

  if (!session || session.user.role !== requiredRole) {
    return NextResponse.redirect(new URL(ROUTES.public.home, request.url));
  }

  return NextResponse.next();
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
