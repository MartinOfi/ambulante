import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitStoreOnboarding, type SubmitStoreOnboardingDeps } from "./submit-store-onboarding";
import type { StoreOnboardingData } from "@/features/store-onboarding/schemas/store-onboarding.schemas";
import type { Store } from "@/shared/schemas/store";
import type { User } from "@/shared/types/user";

const VALID_DATA: StoreOnboardingData = {
  businessName: "Pizzería del Barrio",
  kind: "food-truck",
  cuit: "20304050609",
  neighborhood: "Palermo",
  coverageNotes: "Av. Santa Fe y alrededores",
  days: ["lunes", "martes", "miercoles"],
  openTime: "10:00",
  closeTime: "22:00",
};

const STORE_USER: User = {
  id: "store-owner-public-id",
  email: "store@test.com",
  role: "store",
  displayName: "Tienda Test",
};

const STORE_ID = "generated-store-id-abc";

function createDeps(overrides: Partial<SubmitStoreOnboardingDeps> = {}): {
  deps: SubmitStoreOnboardingDeps;
  createdInputs: unknown[];
} {
  const createdInputs: unknown[] = [];
  const deps: SubmitStoreOnboardingDeps = {
    getCurrentUser: vi.fn().mockResolvedValue(STORE_USER),
    createStore: vi.fn(async (input) => {
      createdInputs.push(input);
      return input as unknown as Store;
    }),
    generateStoreId: vi.fn().mockReturnValue(STORE_ID),
    ...overrides,
  };
  return { deps, createdInputs };
}

describe("submitStoreOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when no user is authenticated", async () => {
    const { deps } = createDeps({
      getCurrentUser: vi.fn().mockResolvedValue(null),
    });

    const result = await submitStoreOnboarding(VALID_DATA, deps);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/sesión|autenticad/i);
  });

  it("returns error when authenticated user does not have 'store' role", async () => {
    const { deps } = createDeps({
      getCurrentUser: vi.fn().mockResolvedValue({ ...STORE_USER, role: "client" }),
    });

    const result = await submitStoreOnboarding(VALID_DATA, deps);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/permiso|rol|tienda/i);
  });

  it("returns error when the store-role user is suspended", async () => {
    const { deps } = createDeps({
      getCurrentUser: vi.fn().mockResolvedValue({ ...STORE_USER, suspended: true }),
    });

    const result = await submitStoreOnboarding(VALID_DATA, deps);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/suspendida|soporte/i);
    expect(deps.createStore).not.toHaveBeenCalled();
  });

  it("returns error when input data fails Zod validation", async () => {
    const { deps } = createDeps();
    const invalid: StoreOnboardingData = { ...VALID_DATA, cuit: "12345" };

    const result = await submitStoreOnboarding(invalid, deps);

    expect(result.success).toBe(false);
    expect(deps.createStore).not.toHaveBeenCalled();
  });

  it("creates a store with owner_id equal to the current user id", async () => {
    const { deps, createdInputs } = createDeps();

    const result = await submitStoreOnboarding(VALID_DATA, deps);

    expect(result.success).toBe(true);
    expect(createdInputs).toHaveLength(1);
    expect(createdInputs[0]).toMatchObject({ ownerId: STORE_USER.id });
  });

  it("uses generated id from deps as the new store id", async () => {
    const { deps, createdInputs } = createDeps();

    await submitStoreOnboarding(VALID_DATA, deps);

    expect(createdInputs[0]).toMatchObject({ id: STORE_ID });
  });

  it("maps form fields onto the store record", async () => {
    const { deps, createdInputs } = createDeps();

    await submitStoreOnboarding(VALID_DATA, deps);

    expect(createdInputs[0]).toMatchObject({
      name: VALID_DATA.businessName,
      kind: VALID_DATA.kind,
    });
  });

  it("persists cuit in the store record for admin validation", async () => {
    const { deps, createdInputs } = createDeps();

    await submitStoreOnboarding(VALID_DATA, deps);

    expect(createdInputs[0]).toMatchObject({ cuit: VALID_DATA.cuit });
  });

  it("creates the store with status='closed' so it is not visible publicly until approved", async () => {
    const { deps, createdInputs } = createDeps();

    await submitStoreOnboarding(VALID_DATA, deps);

    expect(createdInputs[0]).toMatchObject({ status: "closed" });
  });

  it("encodes operating hours into the description/hours field so it survives until profile edit", async () => {
    const { deps, createdInputs } = createDeps();

    await submitStoreOnboarding(VALID_DATA, deps);

    const created = createdInputs[0] as { hours?: string };
    expect(created.hours).toBeDefined();
    expect(created.hours).toContain(VALID_DATA.openTime);
    expect(created.hours).toContain(VALID_DATA.closeTime);
  });

  it("returns the new storeId on success", async () => {
    const { deps } = createDeps();

    const result = await submitStoreOnboarding(VALID_DATA, deps);

    expect(result).toEqual({ success: true, storeId: STORE_ID });
  });

  it("returns a user-friendly error when createStore rejects", async () => {
    const { deps } = createDeps({
      createStore: vi.fn().mockRejectedValue(new Error("PG error: unique violation")),
    });

    const result = await submitStoreOnboarding(VALID_DATA, deps);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/error|intentá|tienda/i);
  });
});
