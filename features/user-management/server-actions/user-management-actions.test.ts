import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User } from "@/shared/schemas/user";
import { USER_ROLES } from "@/shared/constants/user";

const VALID_REASON = "Comportamiento abusivo confirmado";

interface MockState {
  authUser: { id: string } | null;
  isAdmin: boolean;
  user: User | null;
}

const state: MockState = {
  authUser: null,
  isAdmin: false,
  user: null,
};

const mockClient = {
  auth: {
    getUser: vi.fn(async () => ({
      data: { user: state.authUser },
      error: state.authUser === null ? new Error("no user") : null,
    })),
  },
  rpc: vi.fn(async (_name: string) => ({ data: state.isAdmin, error: null })),
};

vi.mock("@/shared/repositories/supabase/client", () => ({
  createRouteHandlerClient: vi.fn(async () => mockClient),
}));

const findById = vi.fn();
const update = vi.fn();
const findAll = vi.fn();
const updateOrder = vi.fn();

vi.mock("@/shared/repositories", () => ({
  SupabaseUserRepository: class {
    findById = findById;
    update = update;
  },
  SupabaseOrderRepository: class {
    findAll = findAll;
    update = updateOrder;
  },
}));

vi.mock("@/shared/utils/server-logger", () => ({
  serverLogger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const { suspendUserAction, reactivateUserAction } = await import("./user-management-actions");

beforeEach(() => {
  state.authUser = null;
  state.isAdmin = false;
  state.user = null;
  findById.mockReset();
  update.mockReset();
  findAll.mockReset().mockResolvedValue([]);
  updateOrder.mockReset();
});

describe("suspendUserAction", () => {
  it("returns unauthenticated when no auth user", async () => {
    state.authUser = null;
    const result = await suspendUserAction({ userId: "u1", reason: VALID_REASON });
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/sesión/i) });
  });

  it("returns forbidden when not admin", async () => {
    state.authUser = { id: "auth-1" };
    state.isAdmin = false;
    const result = await suspendUserAction({ userId: "u1", reason: VALID_REASON });
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/permisos/i) });
  });

  it("rejects invalid reason via schema", async () => {
    state.authUser = { id: "auth-1" };
    state.isAdmin = true;
    const result = await suspendUserAction({ userId: "u1", reason: "ab" });
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.error).toMatch(/3 caracteres/i);
  });

  it("calls service when admin and input valid", async () => {
    state.authUser = { id: "auth-1" };
    state.isAdmin = true;
    const target: User = {
      id: "u1",
      email: "x@x.com",
      role: USER_ROLES.client,
      displayName: "X",
      suspended: false,
    };
    findById.mockResolvedValue(target);
    update.mockResolvedValue({ ...target, suspended: true });
    findAll.mockResolvedValue([]);

    const result = await suspendUserAction({ userId: "u1", reason: VALID_REASON });
    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith("u1", { suspended: true });
  });

  it("returns ok=false when target is admin (state machine rejects)", async () => {
    state.authUser = { id: "auth-1" };
    state.isAdmin = true;
    const target: User = {
      id: "u1",
      email: "x@x.com",
      role: USER_ROLES.admin,
      suspended: false,
    };
    findById.mockResolvedValue(target);

    const result = await suspendUserAction({ userId: "u1", reason: VALID_REASON });
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.error).toMatch(/administrador/i);
  });
});

describe("reactivateUserAction", () => {
  it("returns unauthenticated when no auth user", async () => {
    state.authUser = null;
    const result = await reactivateUserAction({ userId: "u1" });
    expect(result.ok).toBe(false);
  });

  it("calls service when admin and user is suspended", async () => {
    state.authUser = { id: "auth-1" };
    state.isAdmin = true;
    const target: User = {
      id: "u1",
      email: "x@x.com",
      role: USER_ROLES.client,
      suspended: true,
    };
    findById.mockResolvedValue(target);
    update.mockResolvedValue({ ...target, suspended: false });

    const result = await reactivateUserAction({ userId: "u1" });
    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith("u1", { suspended: false });
  });

  it("returns ok=false when user is not suspended (state machine rejects)", async () => {
    state.authUser = { id: "auth-1" };
    state.isAdmin = true;
    const target: User = {
      id: "u1",
      email: "x@x.com",
      role: USER_ROLES.client,
      suspended: false,
    };
    findById.mockResolvedValue(target);

    const result = await reactivateUserAction({ userId: "u1" });
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.error).toMatch(/no está suspendido/i);
  });
});
