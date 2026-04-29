import { describe, it, expect, vi, beforeEach } from "vitest";
import { ORDER_STATUS } from "@/shared/constants/order";
import { ORDER_DOMAIN_EVENT } from "@/shared/domain/events";
import type { Order } from "@/shared/schemas/order";
import type { Product } from "@/shared/schemas/product";
import type { Store } from "@/shared/schemas/store";
import type { User } from "@/shared/schemas/user";
import { MAX_ITEMS_PER_ORDER, MAX_QUANTITY_PER_ITEM } from "@/features/order-flow/constants";
import type { SubmitOrderInput } from "@/features/order-flow/schemas";

const AUTH_USER_ID = "auth-user-uuid";
const CUSTOMER_PUBLIC_ID = "11111111-1111-4111-8111-111111111111";
const STORE_PUBLIC_ID = "22222222-2222-4222-8222-222222222222";
const PRODUCT_A_ID = "33333333-3333-4333-8333-333333333333";
const PRODUCT_B_ID = "44444444-4444-4444-8444-444444444444";
const PRODUCT_C_ID = "55555555-5555-4555-8555-555555555555";
const NEW_ORDER_PUBLIC_ID = "66666666-6666-4666-8666-666666666666";

interface MockState {
  authUser: { id: string } | null;
  authError: Error | null;
  customer: User | null;
  store: Store | null;
  products: readonly Product[];
  createdOrder: Order | null;
  createShouldThrow: Error | null;
}

const state: MockState = {
  authUser: null,
  authError: null,
  customer: null,
  store: null,
  products: [],
  createdOrder: null,
  createShouldThrow: null,
};

const mockClient = {
  auth: {
    getUser: vi.fn(async () => ({
      data: { user: state.authUser },
      error: state.authError,
    })),
  },
};

vi.mock("@/shared/repositories/supabase/client", () => ({
  createRouteHandlerClient: vi.fn(async () => mockClient),
}));

const findByAuthUserId = vi.fn(async (_id: string) => state.customer);
const findStoreById = vi.fn(async (_id: string) => state.store);
const findAllProducts = vi.fn(async () => state.products);
const createOrder = vi.fn(async (_input: unknown) => {
  if (state.createShouldThrow !== null) throw state.createShouldThrow;
  if (state.createdOrder === null) throw new Error("test setup: createdOrder not set");
  return state.createdOrder;
});

vi.mock("@/shared/repositories", () => ({
  SupabaseUserRepository: class {
    findByAuthUserId = findByAuthUserId;
  },
  SupabaseStoreRepository: class {
    findById = findStoreById;
  },
  SupabaseProductRepository: class {
    findAll = findAllProducts;
  },
  SupabaseOrderRepository: class {
    create = createOrder;
  },
}));

const publishEvent = vi.fn();

vi.mock("@/shared/domain/event-bus", () => ({
  eventBus: { publish: publishEvent, subscribe: vi.fn(), registerSerializationHook: vi.fn() },
}));

vi.mock("@/shared/utils/server-logger", () => ({
  serverLogger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const { submitOrder } = await import("./actions");

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: CUSTOMER_PUBLIC_ID,
    email: "cliente@example.com",
    role: "client",
    displayName: "Cliente Test",
    suspended: false,
    ...overrides,
  };
}

function makeStore(overrides: Partial<Store> = {}): Store {
  return {
    id: STORE_PUBLIC_ID,
    name: "La Tienda",
    kind: "food-truck",
    photoUrl: "https://example.com/photo.jpg",
    location: { lat: -34.6, lng: -58.4 },
    distanceMeters: 0,
    status: "open",
    priceFromArs: 100,
    tagline: "Rica comida",
    ownerId: "00000000-0000-4000-8000-000000000099",
    ...overrides,
  };
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: PRODUCT_A_ID,
    storeId: STORE_PUBLIC_ID,
    name: "Empanada de carne",
    priceArs: 200,
    isAvailable: true,
    ...overrides,
  };
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: NEW_ORDER_PUBLIC_ID,
    clientId: CUSTOMER_PUBLIC_ID,
    storeId: STORE_PUBLIC_ID,
    status: ORDER_STATUS.ENVIADO,
    items: [
      {
        productId: PRODUCT_A_ID,
        productName: "Empanada de carne",
        productPriceArs: 200,
        quantity: 2,
      },
    ],
    notes: undefined,
    createdAt: "2026-04-29T13:30:00.000Z",
    updatedAt: "2026-04-29T13:30:00.000Z",
    ...overrides,
  };
}

const validHappyInput: SubmitOrderInput = {
  storeId: STORE_PUBLIC_ID,
  items: [
    { productId: PRODUCT_A_ID, quantity: 2 },
    { productId: PRODUCT_B_ID, quantity: 1 },
    { productId: PRODUCT_C_ID, quantity: 3 },
  ],
};

beforeEach(() => {
  state.authUser = null;
  state.authError = null;
  state.customer = null;
  state.store = null;
  state.products = [];
  state.createdOrder = null;
  state.createShouldThrow = null;

  findByAuthUserId.mockClear();
  findStoreById.mockClear();
  findAllProducts.mockClear();
  createOrder.mockClear();
  publishEvent.mockClear();
});

describe("submitOrder", () => {
  it("happy path: crea pedido con snapshot server-side y publica ORDER_SENT", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.customer = makeUser();
    state.store = makeStore();
    state.products = [
      makeProduct({ id: PRODUCT_A_ID, name: "Empanada", priceArs: 200 }),
      makeProduct({ id: PRODUCT_B_ID, name: "Pizza", priceArs: 800 }),
      makeProduct({ id: PRODUCT_C_ID, name: "Coca", priceArs: 350 }),
    ];
    state.createdOrder = makeOrder({
      items: [
        { productId: PRODUCT_A_ID, productName: "Empanada", productPriceArs: 200, quantity: 2 },
        { productId: PRODUCT_B_ID, productName: "Pizza", productPriceArs: 800, quantity: 1 },
        { productId: PRODUCT_C_ID, productName: "Coca", productPriceArs: 350, quantity: 3 },
      ],
    });

    const result = await submitOrder(validHappyInput);

    expect(result).toEqual({
      ok: true,
      publicId: NEW_ORDER_PUBLIC_ID,
      status: ORDER_STATUS.ENVIADO,
    });

    // El server construye el snapshot autoritativo (no confía en el cliente).
    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(createOrder).toHaveBeenCalledWith({
      clientId: CUSTOMER_PUBLIC_ID,
      storeId: STORE_PUBLIC_ID,
      status: ORDER_STATUS.ENVIADO,
      items: [
        { productId: PRODUCT_A_ID, productName: "Empanada", productPriceArs: 200, quantity: 2 },
        { productId: PRODUCT_B_ID, productName: "Pizza", productPriceArs: 800, quantity: 1 },
        { productId: PRODUCT_C_ID, productName: "Coca", productPriceArs: 350, quantity: 3 },
      ],
      notes: undefined,
    });

    // Evento de dominio post-commit con el tipo correcto.
    expect(publishEvent).toHaveBeenCalledTimes(1);
    expect(publishEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ORDER_DOMAIN_EVENT.ORDER_SENT,
        orderId: NEW_ORDER_PUBLIC_ID,
        clientId: CUSTOMER_PUBLIC_ID,
        storeId: STORE_PUBLIC_ID,
      }),
    );
  });

  it("retorna UNAUTHENTICATED cuando no hay sesión", async () => {
    state.authUser = null;
    state.authError = new Error("no session");

    const result = await submitOrder(validHappyInput);

    expect(result).toEqual({
      ok: false,
      errorCode: "UNAUTHENTICATED",
      message: expect.stringMatching(/sesión/i),
    });
    expect(createOrder).not.toHaveBeenCalled();
    expect(publishEvent).not.toHaveBeenCalled();
  });

  it("retorna VALIDATION_ERROR cuando items está vacío", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.customer = makeUser();

    const result = await submitOrder({
      storeId: STORE_PUBLIC_ID,
      items: [],
    } as SubmitOrderInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.errorCode).toBe("VALIDATION_ERROR");
      expect(result.message).toMatch(/al menos un ítem/i);
    }
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("retorna VALIDATION_ERROR cuando quantity es 0", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.customer = makeUser();

    const result = await submitOrder({
      storeId: STORE_PUBLIC_ID,
      items: [{ productId: PRODUCT_A_ID, quantity: 0 }],
    } as SubmitOrderInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.errorCode).toBe("VALIDATION_ERROR");
      expect(result.message).toMatch(/mayor a cero/i);
    }
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("retorna VALIDATION_ERROR cuando hay más ítems del máximo permitido", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.customer = makeUser();

    const tooManyItems = Array.from({ length: MAX_ITEMS_PER_ORDER + 1 }, () => ({
      productId: PRODUCT_A_ID,
      quantity: 1,
    }));

    const result = await submitOrder({
      storeId: STORE_PUBLIC_ID,
      items: tooManyItems,
    } as SubmitOrderInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("VALIDATION_ERROR");
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("retorna VALIDATION_ERROR cuando quantity excede el máximo por ítem", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.customer = makeUser();

    const result = await submitOrder({
      storeId: STORE_PUBLIC_ID,
      items: [{ productId: PRODUCT_A_ID, quantity: MAX_QUANTITY_PER_ITEM + 1 }],
    } as SubmitOrderInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("VALIDATION_ERROR");
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("retorna PRODUCT_UNAVAILABLE cuando un producto del input no está disponible", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.customer = makeUser();
    state.store = makeStore();
    // Faltan B y C: solo A está disponible. El cliente envía 3 productos.
    state.products = [makeProduct({ id: PRODUCT_A_ID })];

    const result = await submitOrder(validHappyInput);

    expect(result).toEqual({
      ok: false,
      errorCode: "PRODUCT_UNAVAILABLE",
      message: expect.stringMatching(/producto/i),
    });
    expect(createOrder).not.toHaveBeenCalled();
    expect(publishEvent).not.toHaveBeenCalled();
  });

  it("retorna STORE_UNAVAILABLE cuando la tienda está cerrada", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.customer = makeUser();
    state.store = makeStore({ status: "closed" });

    const result = await submitOrder(validHappyInput);

    expect(result).toEqual({
      ok: false,
      errorCode: "STORE_UNAVAILABLE",
      message: expect.stringMatching(/tienda/i),
    });
    expect(findAllProducts).not.toHaveBeenCalled();
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("retorna STORE_UNAVAILABLE cuando la tienda no existe", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.customer = makeUser();
    state.store = null;

    const result = await submitOrder(validHappyInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("STORE_UNAVAILABLE");
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("snapshot de precio se construye en el server, ignorando cualquier valor del cliente", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.customer = makeUser();
    state.store = makeStore();
    // El producto vale 500 server-side. El cliente NO envía precio.
    state.products = [makeProduct({ id: PRODUCT_A_ID, name: "Choripán", priceArs: 500 })];
    state.createdOrder = makeOrder({
      items: [
        { productId: PRODUCT_A_ID, productName: "Choripán", productPriceArs: 500, quantity: 1 },
      ],
    });

    await submitOrder({
      storeId: STORE_PUBLIC_ID,
      items: [{ productId: PRODUCT_A_ID, quantity: 1 }],
    });

    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          {
            productId: PRODUCT_A_ID,
            productName: "Choripán",
            productPriceArs: 500,
            quantity: 1,
          },
        ],
      }),
    );
  });

  it("retorna INTERNAL_ERROR y no publica evento si el repo falla durante create", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.customer = makeUser();
    state.store = makeStore();
    state.products = [makeProduct({ id: PRODUCT_A_ID })];
    state.createShouldThrow = new Error("RPC create_order_with_items failed");

    const result = await submitOrder({
      storeId: STORE_PUBLIC_ID,
      items: [{ productId: PRODUCT_A_ID, quantity: 1 }],
    });

    expect(result).toEqual({
      ok: false,
      errorCode: "INTERNAL_ERROR",
      message: expect.stringMatching(/no se pudo|reintenta/i),
    });
    expect(publishEvent).not.toHaveBeenCalled();
  });

  it("retorna UNAUTHENTICATED si no se encuentra el customer correspondiente al auth user", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.customer = null; // auth user existe pero no hay row en public.users (raro pero posible)

    const result = await submitOrder(validHappyInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("UNAUTHENTICATED");
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("propaga la nota del cliente al repo cuando se incluye", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.customer = makeUser();
    state.store = makeStore();
    state.products = [makeProduct({ id: PRODUCT_A_ID })];
    state.createdOrder = makeOrder();

    await submitOrder({
      storeId: STORE_PUBLIC_ID,
      items: [{ productId: PRODUCT_A_ID, quantity: 1 }],
      notes: "Sin cebolla por favor",
    });

    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ notes: "Sin cebolla por favor" }),
    );
  });
});
