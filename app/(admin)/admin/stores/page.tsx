"use client";

import { useRouter } from "next/navigation";
import { buildHref, ROUTES } from "@/shared/constants/routes";
import { StoreValidationQueueContainer } from "@/features/store-validation/components/StoreValidationQueue/StoreValidationQueue.container";

export default function AdminStoresPage() {
  const router = useRouter();

  function handleSelectStore(storeId: string) {
    router.push(buildHref(ROUTES.admin.storeDetail, { storeId }));
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900">Validación de tiendas</h1>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <StoreValidationQueueContainer onSelectStore={handleSelectStore} />
      </div>
    </div>
  );
}
