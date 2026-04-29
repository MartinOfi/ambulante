import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import {
  clearCaptureStore,
  isE2ETestMode,
  listCapturedPushes,
  subscribeUser,
  unsubscribeUser,
} from "@/shared/services/push.test-capture";

const HTTP_NOT_FOUND = 404;
const HTTP_BAD_REQUEST = 400;
const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;

const MAX_USER_ID_LENGTH = 128;

const userIdSchema = z.string().min(1).max(MAX_USER_ID_LENGTH);

const subscribeBodySchema = z.object({
  action: z.enum(["subscribe", "unsubscribe"]),
  userId: userIdSchema,
});

function notFoundIfDisabled(): NextResponse | null {
  if (!isE2ETestMode()) {
    return NextResponse.json({ error: "Not found" }, { status: HTTP_NOT_FOUND });
  }
  return null;
}

export async function GET(request: Request): Promise<NextResponse> {
  const disabled = notFoundIfDisabled();
  if (disabled !== null) return disabled;

  const { searchParams } = new URL(request.url);
  const parsed = userIdSchema.safeParse(searchParams.get("userId"));
  if (!parsed.success) {
    return NextResponse.json({ error: "userId is required" }, { status: HTTP_BAD_REQUEST });
  }

  return NextResponse.json({ captures: listCapturedPushes(parsed.data) }, { status: HTTP_OK });
}

export async function POST(request: Request): Promise<NextResponse> {
  const disabled = notFoundIfDisabled();
  if (disabled !== null) return disabled;

  const rawBody = await request.json().catch(() => null);
  const parsed = subscribeBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: HTTP_BAD_REQUEST });
  }

  const { action, userId } = parsed.data;
  if (action === "subscribe") {
    subscribeUser(userId);
  } else {
    unsubscribeUser(userId);
  }
  return new NextResponse(null, { status: HTTP_NO_CONTENT });
}

export async function DELETE(): Promise<NextResponse> {
  const disabled = notFoundIfDisabled();
  if (disabled !== null) return disabled;

  clearCaptureStore();
  return new NextResponse(null, { status: HTTP_NO_CONTENT });
}
