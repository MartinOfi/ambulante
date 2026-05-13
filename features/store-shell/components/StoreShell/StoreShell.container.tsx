"use client";

import type { ReactNode } from "react";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useCurrentStoreQuery } from "@/shared/hooks/useCurrentStoreQuery";
import { ROUTES } from "@/shared/constants/routes";
import { useAvailability } from "@/features/store-shell/hooks/useAvailability";
import { useLocationPublishing } from "@/features/store-shell/hooks/useLocationPublishing";
import { StoreShell } from "./StoreShell";

export interface StoreShellContainerProps {
  readonly children: ReactNode;
}

export function StoreShellContainer({ children }: StoreShellContainerProps) {
  const pathname = usePathname();
  const { replace } = useRouter();
  const storeQuery = useCurrentStoreQuery();
  const { isAvailable, toggle } = useAvailability();
  const { locationStatus } = useLocationPublishing();

  useEffect(() => {
    if (!storeQuery.isSuccess) return;
    const store = storeQuery.data;

    if (store === null) {
      if (pathname !== ROUTES.store.pendingApproval && pathname !== ROUTES.store.rejected) {
        replace(ROUTES.auth.registerStore);
      }
      return;
    }

    if (store.validationStatus === "pending" && pathname !== ROUTES.store.pendingApproval) {
      replace(ROUTES.store.pendingApproval);
      return;
    }

    if (store.validationStatus === "rejected" && pathname !== ROUTES.store.rejected) {
      replace(ROUTES.store.rejected);
    }
  }, [storeQuery.isSuccess, storeQuery.data, pathname, replace]);

  const store = storeQuery.data;
  const isOperational =
    store !== null && store !== undefined && store.validationStatus === "approved";

  if (!isOperational) {
    return <>{children}</>;
  }

  return (
    <StoreShell
      currentPath={pathname}
      isAvailable={isAvailable}
      locationStatus={locationStatus}
      onToggleAvailability={toggle}
    >
      {children}
    </StoreShell>
  );
}
