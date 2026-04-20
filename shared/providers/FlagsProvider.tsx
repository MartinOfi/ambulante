"use client";

import { createContext, useContext } from "react";
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
  const context = useContext(FlagsContext);
  if (context === null) {
    throw new Error("useFlagsContext must be used within FlagsProvider");
  }
  return context;
}
