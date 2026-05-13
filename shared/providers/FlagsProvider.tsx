"use client";

import { createContext, use } from "react";
import { type FlagKey } from "@/shared/constants/flags";

const FlagsContext = createContext<Record<FlagKey, boolean> | null>(null);

interface FlagsProviderProps {
  readonly flags: Record<FlagKey, boolean>;
  readonly children: React.ReactNode;
}

export function FlagsProvider({ flags, children }: FlagsProviderProps) {
  return <FlagsContext.Provider value={flags}>{children}</FlagsContext.Provider>;
}

export function useFlagsContext(): Record<FlagKey, boolean> {
  const context = use(FlagsContext);
  if (context === null) {
    throw new Error("useFlagsContext must be used within FlagsProvider");
  }
  return context;
}
