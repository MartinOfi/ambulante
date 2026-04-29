import { describe, it, expect, vi, beforeEach } from "vitest";
import { ORDER_STATUS } from "@/shared/constants/order";
import { ORDER_DOMAIN_EVENT } from "@/shared/domain/events";
import type { Order } from "@/shared/schemas/order";
import { MAX_CANCEL_REASON_LENGTH } from "@/features/orders/cancel.constants";
import type { CancelOrderInput } from "@/features/orders/cancel.schemas";

const AUTH_USER_ID = "auth-user-uuid";
const ORDER_PUBLIC_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_PUBLIC_ID = "22222222-2222-4222-8222-222222222222";
const STORE_PUBLIC_ID = "33333333-3333-4333-8333-333333333333";

interface MockState {
  authUser: { id: string } | null;
  authError: Error | null;
  rpcResponse: { data: unknown; error: { message: string } | null };
  rpcShouldThrow: Error | null;
  orderFromFindById: Order | null;
  findByIdShouldThrow: Error | null;
}

const state: MockState = {
  authUser: null,
  authError: null,
  rpcResponse: { data: null, error: null },
  rpcShouldThrow: null,
  orderFromFindById: null,
  findByIdShouldThrow: null,
};

const rpcMock = vi.fn(async (_name: string, _params: unknown) => {
  if (state.rpcShouldThrow !== null) throw state.rpcShouldThrow;
  return state.rpcResponse;
});

const mockClient = {
  auth: {
    getUser: vi.fn(async () => ({
      data: { user: state.authUser },
      error: state.authError,
    })),
  },
  rpc: rpcMock,
};

vi.mock("@/shared/repositories/supabase/client", () => ({
  createRouteHandlerClient: vi.fn(async () => mockClient),
}));

const findOrderById = vi.fn(async (_id: string) => {
  if (state.findByIdShouldThrow !== null) throw state.findByIdShouldThrow;
  return state.orderFromFindById;
});

vi.mock("@/shared/repositories", () => ({
  SupabaseOrderRepository: class {
    findById = findOrderById;
  },
}));

const publishEvent = vi.fn();

vi.mock("@/shared/domain/event-bus", () => ({
  eventBus: { publish: publishEvent, subscribe: vi.fn(), registerSerializationHook: vi.fn() },
}));

vi.mock("@/shared/utils/server-logger", () => ({
  serverLogger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const { cancelOrder } = await import("./actions");

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: ORDER_PUBLIC_ID,
    clientId: CUSTOMER_PUBLIC_ID,
    storeId: STORE_PUBLIC_ID,
    status: ORDER_STATUS.CANCELADO,
    items: [
      {
        productId: "44444444-4444-4444-8444-444444444444",
        productName: "Empanada",
        productPriceArs: 200,
        quantity: 2,
      },
    ],
    notes: undefined,
    createdAt: "2026-04-29T12:00:00.000Z",
    updatedAt: "2026-04-29T13:30:00.000Z",
    ...overrides,
  };
}

const validInput: CancelOrderInput = {
  publicId: ORDER_PUBLIC_ID,
  reason: "Cambié de idea",
};

beforeEach(() => {
  state.authUser = null;
  state.authError = null;
  state.rpcResponse = { data: null, error: null };
  state.rpcShouldThrow = null;
  state.orderFromFindById = null;
  state.findByIdShouldThrow = null;

  rpcMock.mockClear();
  findOrderById.mockClear();
  publishEvent.mockClear();
});

describe("cancelOrder", () => {
  it("happy path: cancela ENVIADO y publica ORDER_CANCELLED con datos del order", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = {
      data: { ok: true, publicId: ORDER_PUBLIC_ID },
      error: null,
    };
    state.orderFromFindById = makeOrder();

    const result = await cancelOrder(validInput);

    expect(result).toEqual({
      ok: true,
      publicId: ORDER_PUBLIC_ID,
      status: ORDER_STATUS.CANCELADO,
    });

    expect(rpcMock).toHaveBeenCalledWith("cancel_order_by_customer", {
      p_public_id: ORDER_PUBLIC_ID,
      p_reason: "Cambié de idea",
    });

    expect(publishEvent).toHaveBeenCalledTimes(1);
    expect(publishEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ORDER_DOMAIN_EVENT.ORDER_CANCELLED,
        orderId: ORDER_PUBLIC_ID,
        clientId: CUSTOMER_PUBLIC_ID,
        storeId: STORE_PUBLIC_ID,
        sentAt: new Date("2026-04-29T12:00:00.000Z"),
      }),
    );
  });

  it("propaga reason=null al RPC cuando se omite", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = { data: { ok: true, publicId: ORDER_PUBLIC_ID }, error: null };
    state.orderFromFindById = makeOrder();

    await cancelOrder({ publicId: ORDER_PUBLIC_ID });

    expect(rpcMock).toHaveBeenCalledWith("cancel_order_by_customer", {
      p_public_id: ORDER_PUBLIC_ID,
      p_reason: null,
    });
  });

  it("retorna ORDER_NOT_FOUND cuando el RPC reporta not_found", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = { data: { ok: false, error: "not_found" }, error: null };

    const result = await cancelOrder(validInput);

    expect(result).toEqual({
      ok: false,
      errorCode: "ORDER_NOT_FOUND",
      message: expect.stringMatching(/no existe|no es tuyo/i),
    });
    expect(publishEvent).not.toHaveBeenCalled();
  });

  it("retorna INVALID_TRANSITION con mensaje 'aceptó' cuando estado es ACEPTADO", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = {
      data: { ok: false, error: "invalid_transition", currentStatus: "aceptado" },
      error: null,
    };

    const result = await cancelOrder(validInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.errorCode).toBe("INVALID_TRANSITION");
      expect(result.message).toMatch(/aceptó/i);
    }
    expect(publishEvent).not.toHaveBeenCalled();
  });

  it("retorna INVALID_TRANSITION con mensaje 'cerrado' cuando estado es FINALIZADO", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = {
      data: { ok: false, error: "invalid_transition", currentStatus: "finalizado" },
      error: null,
    };

    const result = await cancelOrder(validInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.errorCode).toBe("INVALID_TRANSITION");
      expect(result.message).toMatch(/cerrado/i);
    }
  });

  it("retorna INVALID_TRANSITION con mensaje fallback cuando currentStatus es desconocido", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = {
      data: { ok: false, error: "invalid_transition", currentStatus: "unknown_status" },
      error: null,
    };

    const result = await cancelOrder(validInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.errorCode).toBe("INVALID_TRANSITION");
      expect(result.message).toMatch(/no podés cancelar/i);
    }
  });

  it("retorna UNAUTHENTICATED cuando el RPC reporta unauthenticated", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = { data: { ok: false, error: "unauthenticated" }, error: null };

    const result = await cancelOrder(validInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("UNAUTHENTICATED");
    expect(publishEvent).not.toHaveBeenCalled();
  });

  it("retorna VALIDATION_ERROR cuando publicId no es UUID", async () => {
    state.authUser = { id: AUTH_USER_ID };

    const result = await cancelOrder({ publicId: "not-a-uuid" } as CancelOrderInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("VALIDATION_ERROR");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("retorna VALIDATION_ERROR cuando reason excede el máximo", async () => {
    state.authUser = { id: AUTH_USER_ID };

    const result = await cancelOrder({
      publicId: ORDER_PUBLIC_ID,
      reason: "x".repeat(MAX_CANCEL_REASON_LENGTH + 1),
    });

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("VALIDATION_ERROR");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("retorna UNAUTHENTICATED cuando no hay sesión", async () => {
    state.authUser = null;
    state.authError = new Error("no session");

    const result = await cancelOrder(validInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("UNAUTHENTICATED");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("retorna INTERNAL_ERROR cuando el RPC falla con error de Supabase", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = { data: null, error: { message: "DB connection lost" } };

    const result = await cancelOrder(validInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("INTERNAL_ERROR");
    expect(publishEvent).not.toHaveBeenCalled();
  });

  it("retorna INTERNAL_ERROR cuando el RPC throwsea", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcShouldThrow = new Error("network error");

    const result = await cancelOrder(validInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("INTERNAL_ERROR");
    expect(publishEvent).not.toHaveBeenCalled();
  });

  it("la cancelación es exitosa aunque la lectura post-cancel para el evento falle", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = { data: { ok: true, publicId: ORDER_PUBLIC_ID }, error: null };
    state.findByIdShouldThrow = new Error("read failed");

    const result = await cancelOrder(validInput);

    // El usuario sigue viendo el cancel exitoso — el event es best-effort.
    expect(result).toEqual({
      ok: true,
      publicId: ORDER_PUBLIC_ID,
      status: ORDER_STATUS.CANCELADO,
    });
    expect(publishEvent).not.toHaveBeenCalled();
  });

  it("la cancelación es exitosa aunque findById retorne null (orden ya borrado)", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = { data: { ok: true, publicId: ORDER_PUBLIC_ID }, error: null };
    state.orderFromFindById = null;

    const result = await cancelOrder(validInput);

    expect(result.ok).toBe(true);
    expect(publishEvent).not.toHaveBeenCalled();
  });
});
