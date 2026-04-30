import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User } from "@/shared/schemas/user";
import type { UpdateProfileInput } from "@/features/profile/profile.schemas";
import { MAX_DISPLAY_NAME_LENGTH } from "@/features/profile/profile.constants";

const AUTH_USER_ID = "auth-uuid";
const USER_PUBLIC_ID = "11111111-1111-4111-8111-111111111111";

interface MockState {
  authUser: { id: string } | null;
  customer: User | null;
  updated: User | null;
  updateShouldThrow: Error | null;
}

const state: MockState = {
  authUser: null,
  customer: null,
  updated: null,
  updateShouldThrow: null,
};

const mockClient = {
  auth: {
    getUser: vi.fn(async () => ({
      data: { user: state.authUser },
      error: state.authUser === null ? new Error("no user") : null,
    })),
  },
};

vi.mock("@/shared/repositories/supabase/client", () => ({
  createRouteHandlerClient: vi.fn(async () => mockClient),
}));

const findByAuthUserIdMock = vi.fn(async (_id: string) => state.customer);
const updateMock = vi.fn(async (_id: string, _patch: unknown) => {
  if (state.updateShouldThrow !== null) throw state.updateShouldThrow;
  if (state.updated === null) throw new Error("test setup: updated not set");
  return state.updated;
});

vi.mock("@/shared/repositories", () => ({
  SupabaseUserRepository: class {
    findByAuthUserId = findByAuthUserIdMock;
    update = updateMock;
  },
}));

vi.mock("@/shared/utils/server-logger", () => ({
  serverLogger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const { updateProfile } = await import("./actions");

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: USER_PUBLIC_ID,
    email: "cliente@example.com",
    role: "client",
    displayName: "Nombre Original",
    avatarUrl: undefined,
    suspended: false,
    ...overrides,
  };
}

beforeEach(() => {
  state.authUser = null;
  state.customer = null;
  state.updated = null;
  state.updateShouldThrow = null;
  findByAuthUserIdMock.mockClear();
  updateMock.mockClear();
});

describe("updateProfile", () => {
  it("happy path: actualiza display_name y devuelve el user", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.customer = makeUser();
    state.updated = makeUser({ displayName: "Nuevo Nombre" });

    const result = await updateProfile({ displayName: "Nuevo Nombre" });

    expect(result).toEqual({ ok: true, user: state.updated });
    expect(updateMock).toHaveBeenCalledWith(USER_PUBLIC_ID, { displayName: "Nuevo Nombre" });
  });

  it("happy path: actualiza avatar_url", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.customer = makeUser();
    const newUrl = "https://example.com/avatars/abc.webp";
    state.updated = makeUser({ avatarUrl: newUrl });

    const result = await updateProfile({ avatarUrl: newUrl });

    expect(result.ok).toBe(true);
    expect(updateMock).toHaveBeenCalledWith(USER_PUBLIC_ID, { avatarUrl: newUrl });
  });

  it("happy path: actualiza ambos display_name y avatar_url", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.customer = makeUser();
    state.updated = makeUser({
      displayName: "Nuevo",
      avatarUrl: "https://example.com/avatars/x.png",
    });

    const result = await updateProfile({
      displayName: "Nuevo",
      avatarUrl: "https://example.com/avatars/x.png",
    });

    expect(result.ok).toBe(true);
    expect(updateMock).toHaveBeenCalledWith(USER_PUBLIC_ID, {
      displayName: "Nuevo",
      avatarUrl: "https://example.com/avatars/x.png",
    });
  });

  it("VALIDATION_ERROR cuando no hay cambios", async () => {
    const result = await updateProfile({} as UpdateProfileInput);

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.errorCode).toBe("VALIDATION_ERROR");
      expect(result.message).toMatch(/ningún cambio/i);
    }
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("VALIDATION_ERROR cuando displayName es string vacío", async () => {
    state.authUser = { id: AUTH_USER_ID };

    const result = await updateProfile({ displayName: "" });

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("VALIDATION_ERROR");
  });

  it("VALIDATION_ERROR cuando displayName excede el máximo", async () => {
    const result = await updateProfile({ displayName: "x".repeat(MAX_DISPLAY_NAME_LENGTH + 1) });

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("VALIDATION_ERROR");
  });

  it("VALIDATION_ERROR cuando avatarUrl no es URL válida", async () => {
    const result = await updateProfile({ avatarUrl: "not-a-url" });

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("VALIDATION_ERROR");
  });

  it("UNAUTHENTICATED cuando no hay sesión", async () => {
    state.authUser = null;

    const result = await updateProfile({ displayName: "Nuevo" });

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("UNAUTHENTICATED");
  });

  it("UNAUTHENTICATED cuando el customer no existe en la tabla users", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.customer = null;

    const result = await updateProfile({ displayName: "Nuevo" });

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("UNAUTHENTICATED");
  });

  it("INTERNAL_ERROR cuando el repo falla", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.customer = makeUser();
    state.updateShouldThrow = new Error("DB error");

    const result = await updateProfile({ displayName: "Nuevo" });

    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errorCode).toBe("INTERNAL_ERROR");
  });

  it("avatarUrl puede ser null para borrar el avatar existente", async () => {
    state.authUser = { id: AUTH_USER_ID };
    state.customer = makeUser({ avatarUrl: "https://example.com/old.webp" });
    state.updated = makeUser({ avatarUrl: undefined });

    const result = await updateProfile({ avatarUrl: null });

    expect(result.ok).toBe(true);
    expect(updateMock).toHaveBeenCalledWith(USER_PUBLIC_ID, { avatarUrl: null });
  });
});
