"use client";

import { useRouter, useParams } from "next/navigation";
import { ROUTES } from "@/shared/constants/routes";
import { StoreDetailPanelContainer } from "@/features/store-validation/components/StoreDetailPanel/StoreDetailPanel.container";

export default function AdminStoreDetailPage() {
  const router = useRouter();
  const params = useParams<{ storeId: string }>();

  function handleActionComplete() {
    router.push(ROUTES.admin.stores);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900">Detalle de tienda</h1>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <StoreDetailPanelContainer
          storeId={params.storeId}
          onActionComplete={handleActionComplete}
        />
      </div>
    </div>
  );
}
