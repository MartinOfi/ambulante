import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/shared/repositories/supabase/client";
import { ROUTES } from "@/shared/constants/routes";

type EmailOtpType = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL(`${ROUTES.auth.error}?reason=missing_token`, origin));
  }

  const supabase = await createRouteHandlerClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    const reason = error.message?.toLowerCase().includes("expired")
      ? "link_expired"
      : error.message?.toLowerCase().includes("already")
        ? "already_confirmed"
        : "confirmation_failed";

    return NextResponse.redirect(new URL(`${ROUTES.auth.error}?reason=${reason}`, origin));
  }

  const redirectTo = next ?? ROUTES.auth.login;
  return NextResponse.redirect(new URL(redirectTo, origin));
}
