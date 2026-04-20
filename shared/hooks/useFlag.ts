"use client";

import { type FlagKey } from "@/shared/constants/flags";
import { useFlagsContext } from "@/shared/providers/FlagsProvider";

export function useFlag(key: FlagKey): boolean {
  const flags = useFlagsContext();
  return flags[key];
}
