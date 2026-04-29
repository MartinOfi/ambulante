import { describe, it, expect } from "vitest";

import { REQUEST_ID_HEADER } from "@/shared/constants/observability";
import { getRequestId, readOrCreateRequestId, isValidRequestId } from "./request-id";

describe("getRequestId", () => {
  it("returns the header value when present", () => {
    const headers = new Headers({ [REQUEST_ID_HEADER]: "abc-123" });
    expect(getRequestId(headers)).toBe("abc-123");
  });

  it("is case-insensitive on the header name (HTTP semantics)", () => {
    const headers = new Headers({ "X-Request-Id": "abc-123" });
    expect(getRequestId(headers)).toBe("abc-123");
  });

  it("returns null when the header is absent", () => {
    const headers = new Headers();
    expect(getRequestId(headers)).toBeNull();
  });

  it("returns null for whitespace-only header", () => {
    const headers = new Headers({ [REQUEST_ID_HEADER]: "   " });
    expect(getRequestId(headers)).toBeNull();
  });

  it("trims surrounding whitespace from the header value", () => {
    const headers = new Headers({ [REQUEST_ID_HEADER]: "  req-1  " });
    expect(getRequestId(headers)).toBe("req-1");
  });
});

describe("isValidRequestId", () => {
  it("accepts a UUID v4", () => {
    expect(isValidRequestId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isValidRequestId("")).toBe(false);
  });

  it("rejects values with newlines (header injection guard)", () => {
    expect(isValidRequestId("abc\r\nX-Evil: 1")).toBe(false);
  });

  it("rejects overly long values", () => {
    expect(isValidRequestId("a".repeat(129))).toBe(false);
  });

  it("accepts short alphanumeric ids (e.g. AWS X-Ray)", () => {
    expect(isValidRequestId("1-5759e988-bd862e3fe1be46a994272793")).toBe(true);
  });
});

describe("readOrCreateRequestId", () => {
  it("returns the incoming id when valid", () => {
    const headers = new Headers({ [REQUEST_ID_HEADER]: "550e8400-e29b-41d4-a716-446655440000" });
    expect(readOrCreateRequestId(headers)).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("generates a new UUID when the header is absent", () => {
    const id = readOrCreateRequestId(new Headers());
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("regenerates when the incoming id exceeds the max length", () => {
    const headers = new Headers({ [REQUEST_ID_HEADER]: "a".repeat(200) });
    const id = readOrCreateRequestId(headers);
    expect(id.length).toBeLessThanOrEqual(128);
    expect(id).not.toBe("a".repeat(200));
  });
});
