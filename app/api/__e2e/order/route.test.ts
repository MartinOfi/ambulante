// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { ORDER_STATUS } from "@/shared/constants/order";
import { orderRepository } from "@/shared/repositories/mock/order.mock";
import { E2E_TEST_MODE_ENV, E2E_TEST_MODE_FLAG } from "@/shared/services/push.test-capture";

import { POST } from "./route";

const HTTP_NOT_FOUND = 404;
const HTTP_BAD_REQUEST = 400;
const HTTP_CREATED = 201;

const VALID_BODY = {
  clientId: "demo-client-1",
  storeId: "store-demo-1",
  items: [
    {
      productId: "p1",
      productName: "Test product",
      productPriceArs: 1000,
      quantity: 1,
    },
  ],
};

beforeEach(() => {
  process.env[E2E_TEST_MODE_ENV] = E2E_TEST_MODE_FLAG;
});

afterEach(() => {
  delete process.env[E2E_TEST_MODE_ENV];
});

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/__e2e/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/__e2e/order", () => {
  it("returns 404 when E2E flag is unset", async () => {
    delete process.env[E2E_TEST_MODE_ENV];
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(HTTP_NOT_FOUND);
  });

  it("returns 400 when body is missing required fields", async () => {
    const res = await POST(makeRequest({ clientId: "x" }));
    expect(res.status).toBe(HTTP_BAD_REQUEST);
  });

  it("returns 400 when items array is empty", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, items: [] }));
    expect(res.status).toBe(HTTP_BAD_REQUEST);
  });

  it("creates an order in RECIBIDO state and returns its id", async () => {
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(HTTP_CREATED);

    const body: { orderId: string } = await res.json();
    expect(body.orderId).toBeTruthy();

    const persisted = await orderRepository.findById(body.orderId);
    expect(persisted).not.toBeNull();
    expect(persisted?.status).toBe(ORDER_STATUS.RECIBIDO);
    expect(persisted?.clientId).toBe(VALID_BODY.clientId);
    expect(persisted?.storeId).toBe(VALID_BODY.storeId);
  });
});
