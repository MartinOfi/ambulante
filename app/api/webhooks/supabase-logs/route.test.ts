import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCaptureException, mockCaptureMessage } = vi.hoisted(() => ({
  mockCaptureException: vi.fn(),
  mockCaptureMessage: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mockCaptureException,
  captureMessage: mockCaptureMessage,
}));

vi.mock("@/shared/config/env", () => ({
  env: {
    SUPABASE_WEBHOOK_SECRET: "test-webhook-secret-min16",
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { POST } from "./route";

const VALID_TOKEN = "Bearer test-webhook-secret-min16";
const VALID_TIMESTAMP = "2026-04-28T22:00:00.000Z";

function makeRequest(body: unknown, authHeader?: string) {
  return new NextRequest("http://localhost/api/webhooks/supabase-logs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader !== undefined ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(body),
  });
}

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt-001",
    timestamp: VALID_TIMESTAMP,
    event_message: "Connection pool exhausted",
    level: "error",
    metadata: { source: "postgres" },
    ...overrides,
  };
}

describe("POST /api/webhooks/supabase-logs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns 401 when Authorization header is absent", async () => {
      const res = await POST(makeRequest(makeEvent()));
      expect(res.status).toBe(401);
    });

    it("returns 401 when token is wrong", async () => {
      const res = await POST(makeRequest(makeEvent(), "Bearer wrong-token"));
      expect(res.status).toBe(401);
    });
  });

  describe("body validation", () => {
    it("returns 400 when body is not valid JSON schema", async () => {
      const res = await POST(makeRequest({ bad: "payload" }, VALID_TOKEN));
      expect(res.status).toBe(400);
    });

    it("returns 400 when level is not a recognized value", async () => {
      const res = await POST(makeRequest(makeEvent({ level: "critical" }), VALID_TOKEN));
      expect(res.status).toBe(400);
    });
  });

  describe("level filtering", () => {
    it("ignores info events and returns 200 without calling Sentry", async () => {
      const res = await POST(makeRequest(makeEvent({ level: "info" }), VALID_TOKEN));
      expect(res.status).toBe(200);
      expect(mockCaptureException).not.toHaveBeenCalled();
      expect(mockCaptureMessage).not.toHaveBeenCalled();
    });

    it("ignores debug events and returns 200 without calling Sentry", async () => {
      const res = await POST(makeRequest(makeEvent({ level: "debug" }), VALID_TOKEN));
      expect(res.status).toBe(200);
      expect(mockCaptureException).not.toHaveBeenCalled();
      expect(mockCaptureMessage).not.toHaveBeenCalled();
    });
  });

  describe("Sentry dispatch", () => {
    it("calls captureMessage for warning events", async () => {
      const event = makeEvent({ level: "warning", event_message: "Slow query detected" });
      const res = await POST(makeRequest(event, VALID_TOKEN));
      expect(res.status).toBe(200);
      expect(mockCaptureMessage).toHaveBeenCalledOnce();
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        "Slow query detected",
        expect.objectContaining({ level: "warning" }),
      );
      expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it("calls captureException for error events", async () => {
      const event = makeEvent({ level: "error", event_message: "Connection pool exhausted" });
      const res = await POST(makeRequest(event, VALID_TOKEN));
      expect(res.status).toBe(200);
      expect(mockCaptureException).toHaveBeenCalledOnce();
      const capturedError = mockCaptureException.mock.calls[0][0];
      expect(capturedError).toBeInstanceOf(Error);
      expect(capturedError.message).toBe("Connection pool exhausted");
      expect(mockCaptureMessage).not.toHaveBeenCalled();
    });

    it("passes metadata as extra context to Sentry", async () => {
      const event = makeEvent({ level: "error", metadata: { source: "auth", code: "500" } });
      await POST(makeRequest(event, VALID_TOKEN));
      expect(mockCaptureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: expect.objectContaining({ source: "auth", code: "500" }),
        }),
      );
    });
  });

  describe("array payload", () => {
    it("processes an array of events and dispatches only warning+ to Sentry", async () => {
      const events = [
        makeEvent({ level: "debug" }),
        makeEvent({ level: "info" }),
        makeEvent({ level: "warning", event_message: "Slow query" }),
        makeEvent({ level: "error", event_message: "Pool exhausted" }),
      ];
      const res = await POST(makeRequest(events, VALID_TOKEN));
      expect(res.status).toBe(200);
      expect(mockCaptureMessage).toHaveBeenCalledOnce();
      expect(mockCaptureException).toHaveBeenCalledOnce();
      const body = await res.json();
      expect(body).toEqual({ received: 4, dispatched: 2 });
    });

    it("returns 400 when array contains an invalid event", async () => {
      const events = [makeEvent(), { bad: "event" }];
      const res = await POST(makeRequest(events, VALID_TOKEN));
      expect(res.status).toBe(400);
    });
  });

  describe("response shape", () => {
    it("returns received and dispatched counts for a single event", async () => {
      const res = await POST(makeRequest(makeEvent({ level: "error" }), VALID_TOKEN));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ received: 1, dispatched: 1 });
    });
  });
});
