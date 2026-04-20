import { StoreValidationQueueContainer } from "@/features/store-validation/components/StoreValidationQueue/StoreValidationQueue.container";

export default function AdminStoresPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900">Validación de tiendas</h1>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <StoreValidationQueueContainer />
      </div>
    </div>
  );
}
