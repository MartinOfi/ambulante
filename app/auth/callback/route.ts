import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/shared/repositories/supabase/client";
import { getRoleRedirect } from "@/features/auth/utils/role-redirect";
import { extractRole, safeRedirectPath } from "@/shared/utils/auth-helpers";
import { ROUTES } from "@/shared/constants/routes";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL(`${ROUTES.auth.error}?reason=missing_code`, origin));
  }

  const supabase = await createRouteHandlerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(new URL(`${ROUTES.auth.error}?reason=exchange_failed`, origin));
  }

  const role = extractRole(data.session.user.user_metadata, data.session.user.app_metadata);

  const redirectTo = safeRedirectPath(next, getRoleRedirect(role));
  return NextResponse.redirect(new URL(redirectTo, origin));
}
