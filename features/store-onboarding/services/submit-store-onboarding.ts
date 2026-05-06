import { storeOnboardingSchema } from "@/features/store-onboarding/schemas/store-onboarding.schemas";
import type {
  StoreOnboardingData,
  OnboardingDay,
} from "@/features/store-onboarding/schemas/store-onboarding.schemas";
import { USER_ROLES } from "@/shared/constants/user";
import { STORE_STATUS } from "@/shared/constants/store";
import type { Store } from "@/shared/schemas/store";
import type { CreateStoreInput } from "@/shared/repositories/store";
import type { User } from "@/shared/types/user";
import { logger } from "@/shared/utils/logger";

const ERROR_MESSAGES = {
  unauthenticated: "Iniciá sesión para registrar tu tienda.",
  wrongRole: "Tu cuenta no tiene permisos de tienda.",
  suspended: "Tu cuenta está suspendida. Contactá a soporte.",
  invalid: "Los datos del formulario son inválidos. Revisá los pasos anteriores.",
  failed: "No pudimos registrar tu tienda. Intentá de nuevo.",
} as const;

export interface SubmitStoreOnboardingDeps {
  readonly getCurrentUser: () => Promise<User | null>;
  readonly createStore: (input: CreateStoreInput) => Promise<Store>;
  readonly generateStoreId: () => string;
}

export type SubmitStoreOnboardingResult =
  | { readonly success: true; readonly storeId: string }
  | { readonly success: false; readonly error: string };

export async function submitStoreOnboarding(
  data: StoreOnboardingData,
  deps: SubmitStoreOnboardingDeps,
): Promise<SubmitStoreOnboardingResult> {
  const user = await deps.getCurrentUser();
  if (user === null) {
    return { success: false, error: ERROR_MESSAGES.unauthenticated };
  }

  if (user.role !== USER_ROLES.store) {
    return { success: false, error: ERROR_MESSAGES.wrongRole };
  }

  if (user.suspended === true) {
    return { success: false, error: ERROR_MESSAGES.suspended };
  }

  const parsed = storeOnboardingSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: ERROR_MESSAGES.invalid };
  }

  const storeId = deps.generateStoreId();
  const input: CreateStoreInput = {
    id: storeId,
    ownerId: user.id,
    name: parsed.data.businessName,
    kind: parsed.data.kind,
    cuit: parsed.data.cuit,
    description: buildDescription(parsed.data.neighborhood, parsed.data.coverageNotes),
    hours: formatHours(parsed.data.days, parsed.data.openTime, parsed.data.closeTime),
    status: STORE_STATUS.closed,
    location: { lat: 0, lng: 0 },
    distanceMeters: 0,
  };

  try {
    await deps.createStore(input);
    return { success: true, storeId };
  } catch (error) {
    logger.error("submitStoreOnboarding: createStore failed", {
      ownerId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: ERROR_MESSAGES.failed };
  }
}

function buildDescription(neighborhood: string, coverageNotes: string | undefined): string {
  if (coverageNotes !== undefined && coverageNotes.length > 0) {
    return `${neighborhood}. ${coverageNotes}`;
  }
  return neighborhood;
}

function formatHours(days: readonly OnboardingDay[], openTime: string, closeTime: string): string {
  return `${days.join(", ")}: ${openTime}–${closeTime}`;
}
