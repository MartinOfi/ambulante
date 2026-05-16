"use client";

import { useCurrentStoreQuery } from "@/shared/hooks/useCurrentStoreQuery";

export function RejectionReasonDisplay() {
  const { data: store } = useCurrentStoreQuery();

  if (!store?.rejectionReason) return null;

  return (
    <p
      data-testid="rejection-reason"
      className="max-w-sm rounded-md bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {store.rejectionReason}
    </p>
  );
}
