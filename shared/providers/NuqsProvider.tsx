"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";

export function NuqsProvider({ children }: { readonly children: React.ReactNode }) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
