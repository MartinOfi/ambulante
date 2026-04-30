import { describe, it, expect, vi, beforeEach } from "vitest";
import { ORDER_STATUS } from "@/shared/constants/order";
import { ORDER_DOMAIN_EVENT } from "@/shared/domain/events";
import type { Order } from "@/shared/schemas/order";
import type { StoreOrderTransitionInput } from "@/features/orders/store-transitions.schemas";

const AUTH_USER_ID = "auth-user-uuid";
const ORDER_PUBLIC_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CUSTOMER_PUBLIC_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const STORE_PUBLIC_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

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

const { acceptOrder, rejectOrder, finalizeOrder } = await import("./actions");

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: ORDER_PUBLIC_ID,
    clientId: CUSTOMER_PUBLIC_ID,
    storeId: STORE_PUBLIC_ID,
    status: ORDER_STATUS.RECIBIDO,
    items: [
      {
        productId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        productName: "Empanada",
        productPriceArs: 250,
        quantity: 3,
      },
    ],
    notes: undefined,
    createdAt: "2026-04-30T10:00:00.000Z",
    updatedAt: "2026-04-30T10:05:00.000Z",
    ...overrides,
  };
}

const validInput: StoreOrderTransitionInput = { publicId: ORDER_PUBLIC_ID };

function successRpc(publicId = ORDER_PUBLIC_ID) {
  return { data: { ok: true, publicId }, error: null };
}

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

// ─────────────────────────────────────────────────────────────────────────────
// acceptOrder
// ─────────────────────────────────────────────────────────────────────────────

describe("acceptOrder", () => {
  it("happy path: acepta el pedido y publica ORDER_ACCEPTED", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = successRpc();
    state.orderFromFindById = makeOrder();

    const result = await acceptOrder(validInput);

    expect(result).toEqual({
      ok: true,
      publicId: ORDER_PUBLIC_ID,
      status: ORDER_STATUS.ACEPTADO,
    });

    expect(rpcMock).toHaveBeenCalledWith("accept_order_by_store", {
      p_public_id: ORDER_PUBLIC_ID,
    });

    expect(publishEvent).toHaveBeenCalledTimes(1);
    expect(publishEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ORDER_DOMAIN_EVENT.ORDER_ACCEPTED,
        orderId: ORDER_PUBLIC_ID,
        clientId: CUSTOMER_PUBLIC_ID,
        storeId: STORE_PUBLIC_ID,
        sentAt: new Date("2026-04-30T10:00:00.000Z"),
      }),
    );
  });

  it("retorna ORDER_NOT_FOUND cuando el RPC reporta not_found", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = { data: { ok: false, error: "not_found" }, error: null };

    const result = await acceptOrder(validInput);

    expect(result).toEqual({
      ok: false,
      errorCode: "ORDER_NOT_FOUND",
      message: expect.stringMatching(/no existe|no es de tu tienda/i),
    });
    expect(publishEvent).not.toHaveBeenCalled();
  });

  it("retorna INVALID_TRANSITION cuando el RPC reporta invalid_transition", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = {
      data: { ok: false, error: "invalid_transition", currentStatus: "aceptado" },
      error: null,
    };

    const result = await acceptOrder(validInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.errorCode).toBe("INVALID_TRANSITION");
      expect(result.message).toMatch(/recibido/i);
    }
    expect(publishEvent).not.toHaveBeenCalled();
  });

  it("retorna UNAUTHENTICATED cuando auth.getUser falla", async () => {
    state.authUser = null;
    state.authError = new Error("no session");

    const result = await acceptOrder(validInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("UNAUTHENTICATED");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("retorna UNAUTHENTICATED cuando el RPC reporta unauthenticated", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = { data: { ok: false, error: "unauthenticated" }, error: null };

    const result = await acceptOrder(validInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("UNAUTHENTICATED");
  });

  it("retorna VALIDATION_ERROR cuando publicId no es UUID", async () => {
    const result = await acceptOrder({ publicId: "not-a-uuid" } as StoreOrderTransitionInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("VALIDATION_ERROR");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("retorna INTERNAL_ERROR cuando el RPC falla con error de Supabase", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = { data: null, error: { message: "DB connection lost" } };

    const result = await acceptOrder(validInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("INTERNAL_ERROR");
    expect(publishEvent).not.toHaveBeenCalled();
  });

  it("retorna INTERNAL_ERROR cuando el RPC throwsea", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcShouldThrow = new Error("network error");

    const result = await acceptOrder(validInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("INTERNAL_ERROR");
    expect(publishEvent).not.toHaveBeenCalled();
  });

  it("la aceptación es exitosa aunque la lectura post-commit para el evento falle", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = successRpc();
    state.findByIdShouldThrow = new Error("read failed");

    const result = await acceptOrder(validInput);

    expect(result).toEqual({
      ok: true,
      publicId: ORDER_PUBLIC_ID,
      status: ORDER_STATUS.ACEPTADO,
    });
    expect(publishEvent).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// rejectOrder
// ─────────────────────────────────────────────────────────────────────────────

describe("rejectOrder", () => {
  it("happy path: rechaza el pedido y publica ORDER_REJECTED", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = successRpc();
    state.orderFromFindById = makeOrder();

    const result = await rejectOrder(validInput);

    expect(result).toEqual({
      ok: true,
      publicId: ORDER_PUBLIC_ID,
      status: ORDER_STATUS.RECHAZADO,
    });

    expect(rpcMock).toHaveBeenCalledWith("reject_order_by_store", {
      p_public_id: ORDER_PUBLIC_ID,
    });

    expect(publishEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: ORDER_DOMAIN_EVENT.ORDER_REJECTED }),
    );
  });

  it("retorna INVALID_TRANSITION con mensaje de rechazo cuando estado es aceptado", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = {
      data: { ok: false, error: "invalid_transition", currentStatus: "aceptado" },
      error: null,
    };

    const result = await rejectOrder(validInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.errorCode).toBe("INVALID_TRANSITION");
      expect(result.message).toMatch(/recibido/i);
    }
  });

  it("retorna UNAUTHENTICATED cuando no hay sesión", async () => {
    state.authUser = null;
    state.authError = new Error("no session");

    const result = await rejectOrder(validInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("UNAUTHENTICATED");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("retorna INTERNAL_ERROR cuando el RPC throwsea", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcShouldThrow = new Error("network error");

    const result = await rejectOrder(validInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("INTERNAL_ERROR");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// finalizeOrder
// ─────────────────────────────────────────────────────────────────────────────

describe("finalizeOrder", () => {
  it("happy path: finaliza el pedido y publica ORDER_FINISHED", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = successRpc();
    state.orderFromFindById = makeOrder({ status: ORDER_STATUS.EN_CAMINO });

    const result = await finalizeOrder(validInput);

    expect(result).toEqual({
      ok: true,
      publicId: ORDER_PUBLIC_ID,
      status: ORDER_STATUS.FINALIZADO,
    });

    expect(rpcMock).toHaveBeenCalledWith("finalize_order_by_store", {
      p_public_id: ORDER_PUBLIC_ID,
    });

    expect(publishEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ORDER_DOMAIN_EVENT.ORDER_FINISHED,
        orderId: ORDER_PUBLIC_ID,
        clientId: CUSTOMER_PUBLIC_ID,
        storeId: STORE_PUBLIC_ID,
        sentAt: new Date("2026-04-30T10:00:00.000Z"),
      }),
    );
  });

  it("retorna INVALID_TRANSITION cuando el pedido no está en EN_CAMINO", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = {
      data: { ok: false, error: "invalid_transition", currentStatus: "recibido" },
      error: null,
    };

    const result = await finalizeOrder(validInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.errorCode).toBe("INVALID_TRANSITION");
      expect(result.message).toMatch(/en camino/i);
    }
  });

  it("retorna UNAUTHENTICATED cuando no hay sesión", async () => {
    state.authUser = null;
    state.authError = new Error("no session");

    const result = await finalizeOrder(validInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("UNAUTHENTICATED");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("retorna ORDER_NOT_FOUND cuando el RPC reporta not_found", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = { data: { ok: false, error: "not_found" }, error: null };

    const result = await finalizeOrder(validInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("ORDER_NOT_FOUND");
  });

  it("la finalización es exitosa aunque la lectura post-commit para el evento falle", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.rpcResponse = successRpc();
    state.findByIdShouldThrow = new Error("read failed");

    const result = await finalizeOrder(validInput);

    expect(result).toEqual({
      ok: true,
      publicId: ORDER_PUBLIC_ID,
      status: ORDER_STATUS.FINALIZADO,
    });
    expect(publishEvent).not.toHaveBeenCalled();
  });
});
