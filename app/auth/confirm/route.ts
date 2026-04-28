import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/shared/repositories/supabase/client";
import { safeRedirectPath } from "@/shared/utils/auth-helpers";
import { ROUTES } from "@/shared/constants/routes";

type EmailOtpType = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email";

const VALID_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function isValidOtpType(value: string): value is EmailOtpType {
  return VALID_OTP_TYPES.has(value as EmailOtpType);
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const next = searchParams.get("next");

  if (!tokenHash || !rawType || !isValidOtpType(rawType)) {
    return NextResponse.redirect(new URL(`${ROUTES.auth.error}?reason=missing_token`, origin));
  }

  const supabase = await createRouteHandlerClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: rawType });

  if (error) {
    const reason = error.message?.toLowerCase().includes("expired")
      ? "link_expired"
      : error.message?.toLowerCase().includes("already")
        ? "already_confirmed"
        : "confirmation_failed";

    return NextResponse.redirect(new URL(`${ROUTES.auth.error}?reason=${reason}`, origin));
  }

  const redirectTo = safeRedirectPath(next, ROUTES.auth.login);
  return NextResponse.redirect(new URL(redirectTo, origin));
}
