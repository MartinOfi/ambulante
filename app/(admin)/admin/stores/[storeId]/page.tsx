import { notFound } from "next/navigation";
import { z } from "zod";
import { StoreDetailPanelContainer } from "@/features/store-validation/components/StoreDetailPanel/StoreDetailPanel.container";

interface PageProps {
  readonly params: Promise<{ readonly storeId: string }>;
}

const storeIdSchema = z.string().min(1);

export default async function AdminStoreDetailPage({ params }: PageProps) {
  const { storeId } = await params;
  const parsed = storeIdSchema.safeParse(storeId);
  if (!parsed.success) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900">Detalle de tienda</h1>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <StoreDetailPanelContainer storeId={parsed.data} />
      </div>
    </div>
  );
}
