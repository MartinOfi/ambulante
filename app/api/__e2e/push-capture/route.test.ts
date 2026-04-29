// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import {
  E2E_TEST_MODE_ENV,
  E2E_TEST_MODE_FLAG,
  clearCaptureStore,
  createTestCapturePushSender,
  listCapturedPushes,
} from "@/shared/services/push.test-capture";

import { DELETE, GET, POST } from "./route";

const HTTP_NOT_FOUND = 404;
const HTTP_BAD_REQUEST = 400;
const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;

const USER_ID = "demo-client-1";

beforeEach(() => {
  process.env[E2E_TEST_MODE_ENV] = E2E_TEST_MODE_FLAG;
  clearCaptureStore();
});

afterEach(() => {
  delete process.env[E2E_TEST_MODE_ENV];
  clearCaptureStore();
});

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/__e2e/push-capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("E2E push-capture route gating", () => {
  it("returns 404 from GET when E2E flag is unset", async () => {
    delete process.env[E2E_TEST_MODE_ENV];
    const res = await GET(new NextRequest("http://localhost/api/__e2e/push-capture?userId=x"));
    expect(res.status).toBe(HTTP_NOT_FOUND);
  });

  it("returns 404 from POST when E2E flag is unset", async () => {
    delete process.env[E2E_TEST_MODE_ENV];
    const res = await POST(makePostRequest({ action: "subscribe", userId: "x" }));
    expect(res.status).toBe(HTTP_NOT_FOUND);
  });

  it("returns 404 from DELETE when E2E flag is unset", async () => {
    delete process.env[E2E_TEST_MODE_ENV];
    const res = await DELETE();
    expect(res.status).toBe(HTTP_NOT_FOUND);
  });
});

describe("GET /api/__e2e/push-capture", () => {
  it("returns 400 when userId is missing", async () => {
    const res = await GET(new NextRequest("http://localhost/api/__e2e/push-capture"));
    expect(res.status).toBe(HTTP_BAD_REQUEST);
  });

  it("returns the captured pushes filtered by userId", async () => {
    const sender = createTestCapturePushSender();
    const subscribeRes = await POST(makePostRequest({ action: "subscribe", userId: USER_ID }));
    expect(subscribeRes.status).toBe(HTTP_NO_CONTENT);
    await sender.sendToUser(USER_ID, { title: "Pedido aceptado", body: "Listo" });

    const res = await GET(
      new NextRequest(`http://localhost/api/__e2e/push-capture?userId=${USER_ID}`),
    );
    expect(res.status).toBe(HTTP_OK);
    const body: { captures: Array<{ userId: string; payload: { title: string } }> } =
      await res.json();
    expect(body.captures).toHaveLength(1);
    expect(body.captures[0]?.userId).toBe(USER_ID);
    expect(body.captures[0]?.payload.title).toBe("Pedido aceptado");
  });
});

describe("POST /api/__e2e/push-capture", () => {
  it("returns 400 when body is invalid", async () => {
    const res = await POST(makePostRequest({ action: "garbage" }));
    expect(res.status).toBe(HTTP_BAD_REQUEST);
  });

  it("subscribe action makes the user receive captures", async () => {
    const sender = createTestCapturePushSender();
    await POST(makePostRequest({ action: "subscribe", userId: USER_ID }));
    await sender.sendToUser(USER_ID, { title: "X", body: "Y" });
    expect(listCapturedPushes(USER_ID)).toHaveLength(1);
  });

  it("unsubscribe action stops new captures", async () => {
    const sender = createTestCapturePushSender();
    await POST(makePostRequest({ action: "subscribe", userId: USER_ID }));
    await POST(makePostRequest({ action: "unsubscribe", userId: USER_ID }));
    await sender.sendToUser(USER_ID, { title: "X", body: "Y" });
    expect(listCapturedPushes(USER_ID)).toHaveLength(0);
  });
});

describe("DELETE /api/__e2e/push-capture", () => {
  it("clears subscriptions and captures", async () => {
    const sender = createTestCapturePushSender();
    await POST(makePostRequest({ action: "subscribe", userId: USER_ID }));
    await sender.sendToUser(USER_ID, { title: "X", body: "Y" });
    expect(listCapturedPushes(USER_ID)).toHaveLength(1);

    const res = await DELETE();
    expect(res.status).toBe(HTTP_NO_CONTENT);
    expect(listCapturedPushes(USER_ID)).toHaveLength(0);
  });
});
