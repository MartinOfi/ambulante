import { unstable_cache } from "next/cache";
import { get, getAll } from "@vercel/edge-config";
import { FLAG_DEFAULTS, type FlagKey } from "@/shared/constants/flags";
import { CACHE_REVALIDATION_SECONDS, CACHE_TAGS } from "@/shared/config/cache-config";
import { logger } from "@/shared/utils/logger";

function isEdgeConfigured(): boolean {
  return Boolean(process.env.EDGE_CONFIG);
}

async function getFlagRaw(key: FlagKey): Promise<boolean> {
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

async function getAllFlagsRaw(): Promise<Record<FlagKey, boolean>> {
  if (!isEdgeConfigured()) {
    return { ...FLAG_DEFAULTS };
  }

  try {
    const remoteFlags = await getAll<Record<string, unknown>>();

    return (Object.keys(FLAG_DEFAULTS) as FlagKey[]).reduce<Record<FlagKey, boolean>>(
      (acc, key) => {
        const remote = remoteFlags?.[key];
        const value = typeof remote === "boolean" ? remote : FLAG_DEFAULTS[key];
        return { ...acc, [key]: value };
      },
      {} as Record<FlagKey, boolean>,
    );
  } catch (error: unknown) {
    logger.error("Failed to read all feature flags from Edge Config", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { ...FLAG_DEFAULTS };
  }
}

const getFlag = unstable_cache(getFlagRaw, [`${CACHE_TAGS.FLAGS}-single`], {
  revalidate: CACHE_REVALIDATION_SECONDS.FLAGS,
  tags: [CACHE_TAGS.FLAGS],
});

const getAllFlags = unstable_cache(getAllFlagsRaw, [`${CACHE_TAGS.FLAGS}-all`], {
  revalidate: CACHE_REVALIDATION_SECONDS.FLAGS,
  tags: [CACHE_TAGS.FLAGS],
});

export const flagsService = { getFlag, getAllFlags };
