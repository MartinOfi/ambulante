import { get, getAll } from "@vercel/edge-config";
import { FLAG_DEFAULTS, type FlagKey } from "@/shared/constants/flags";
import { logger } from "@/shared/utils/logger";

function isEdgeConfigured(): boolean {
  return Boolean(process.env.EDGE_CONFIG);
}

async function getFlag(key: FlagKey): Promise<boolean> {
  if (!isEdgeConfigured()) {
    return FLAG_DEFAULTS[key];
  }

  try {
    const value = await get<boolean>(key);
    return value ?? FLAG_DEFAULTS[key];
  } catch (error: unknown) {
    logger.error("Failed to read feature flag from Edge Config", {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return FLAG_DEFAULTS[key];
  }
}

async function getAllFlags(): Promise<Record<FlagKey, boolean>> {
  if (!isEdgeConfigured()) {
    return { ...FLAG_DEFAULTS };
  }

  try {
    const remoteFlags = await getAll<Partial<Record<FlagKey, boolean>>>();

    return Object.fromEntries(
      Object.entries(FLAG_DEFAULTS).map(([key]) => {
        const remote = remoteFlags?.[key as FlagKey];
        return [key, remote !== undefined ? remote : FLAG_DEFAULTS[key as FlagKey]];
      }),
    ) as Record<FlagKey, boolean>;
  } catch (error: unknown) {
    logger.error("Failed to read all feature flags from Edge Config", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { ...FLAG_DEFAULTS };
  }
}

export const flagsService = { getFlag, getAllFlags };
