import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/shared/constants/auth";
import { parseSessionCookie } from "@/shared/utils/session-cookie";
import { getRequiredRole, MIDDLEWARE_MATCHERS } from "@/shared/utils/route-access";
import { ROUTES } from "@/shared/constants/routes";

export function middleware(request: NextRequest): NextResponse {
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

export const config = {
  matcher: MIDDLEWARE_MATCHERS,
};
