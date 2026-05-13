import { storeRepository } from "@/shared/repositories";
import { logger } from "@/shared/utils/logger";
import type { Store } from "@/shared/schemas/store";
import { PROFILE_DAYS } from "@/features/store-profile/schemas/store-profile.schemas";
import type {
  ProfileDay,
  StoreProfile,
  UpdateStoreProfileInput,
} from "@/features/store-profile/schemas/store-profile.schemas";
import type { StoreProfileService } from "./store-profile.service";
import type { UpdateStoreInput } from "@/shared/repositories/store";

const EM_DASH = "–";

function parseDescription(description: string | undefined): {
  neighborhood: string;
  coverageNotes?: string;
} {
  if (description === undefined || description.length === 0) {
    return { neighborhood: "" };
  }
  const sepIndex = description.indexOf(". ");
  if (sepIndex === -1) {
    return { neighborhood: description };
  }
  return {
    neighborhood: description.slice(0, sepIndex),
    coverageNotes: description.slice(sepIndex + 2),
  };
}

function parseHours(hours: string | undefined): {
  days: ProfileDay[];
  openTime: string;
  closeTime: string;
} {
  const fallback = { days: [], openTime: "09:00", closeTime: "18:00" };
  if (hours === undefined || hours.length === 0) return fallback;

  const colonIndex = hours.indexOf(": ");
  if (colonIndex === -1) return fallback;

  const daysStr = hours.slice(0, colonIndex);
  const timesStr = hours.slice(colonIndex + 2);
  const dashIndex = timesStr.indexOf(EM_DASH);
  if (dashIndex === -1) return fallback;

  const rawDays = daysStr
    .split(", ")
    .filter((d): d is ProfileDay => (PROFILE_DAYS as readonly string[]).includes(d));
  if (rawDays.length === 0) return fallback;

  return {
    days: rawDays,
    openTime: timesStr.slice(0, dashIndex),
    closeTime: timesStr.slice(dashIndex + EM_DASH.length),
  };
}

function storeToProfile(store: Store): StoreProfile {
  const { neighborhood, coverageNotes } = parseDescription(store.description);
  const { days, openTime, closeTime } = parseHours(store.hours);

  return {
    storeId: store.id,
    businessName: store.name,
    kind: store.kind,
    neighborhood,
    coverageNotes,
    days,
    openTime,
    closeTime,
  };
}

function buildDescription(neighborhood: string, coverageNotes?: string): string {
  if (coverageNotes !== undefined && coverageNotes.length > 0) {
    return `${neighborhood}. ${coverageNotes}`;
  }
  return neighborhood;
}

function buildHours(days: readonly ProfileDay[], openTime: string, closeTime: string): string {
  return `${days.join(", ")}: ${openTime}${EM_DASH}${closeTime}`;
}

export const supabaseStoreProfileService: StoreProfileService = {
  async getProfile(storeId: string): Promise<StoreProfile> {
    const store = await storeRepository.findById(storeId);
    if (store === null) {
      logger.error("storeProfileService: store not found", { storeId });
      throw new Error(`Profile for store "${storeId}" not found`);
    }
    return storeToProfile(store);
  },

  async updateProfile(storeId: string, input: UpdateStoreProfileInput): Promise<StoreProfile> {
    const current = await storeRepository.findById(storeId);
    if (current === null) {
      logger.error("storeProfileService: store not found for update", { storeId });
      throw new Error(`Profile for store "${storeId}" not found`);
    }

    const patch: UpdateStoreInput = {};

    if (input.businessName !== undefined) patch.name = input.businessName;
    if (input.kind !== undefined) patch.kind = input.kind;

    const current_parsed = storeToProfile(current);
    const neighborhood = input.neighborhood ?? current_parsed.neighborhood;
    const coverageNotes = input.coverageNotes ?? current_parsed.coverageNotes;
    if (input.neighborhood !== undefined || input.coverageNotes !== undefined) {
      patch.description = buildDescription(neighborhood, coverageNotes);
    }

    const days = input.days ?? current_parsed.days;
    const openTime = input.openTime ?? current_parsed.openTime;
    const closeTime = input.closeTime ?? current_parsed.closeTime;
    if (input.days !== undefined || input.openTime !== undefined || input.closeTime !== undefined) {
      patch.hours = buildHours(days, openTime, closeTime);
    }

    const updated = await storeRepository.update(storeId, patch);
    return storeToProfile(updated);
  },
};
