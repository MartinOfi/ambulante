"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { buildHref, ROUTES } from "@/shared/constants/routes";
import { useCurrentStoreQuery } from "@/shared/hooks/useCurrentStoreQuery";
import { useCatalogQuery } from "@/features/catalog/hooks/useCatalogQuery";
import { useDeleteProductMutation } from "@/features/catalog/hooks/useDeleteProductMutation";
import { CatalogList } from "./CatalogList";

export function CatalogListContainer() {
  const t = useTranslations("Catalog.List");
  const { push } = useRouter();
  const storeQuery = useCurrentStoreQuery();
  const storeId = storeQuery.data?.id ?? "";

  const { data: products = [], isLoading, isError } = useCatalogQuery(storeId);
  const deleteMutation = useDeleteProductMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleEdit(productId: string) {
    push(buildHref(ROUTES.store.catalogEdit, { productId }));
  }

  async function handleDelete(productId: string) {
    if (!storeId) {
      push(ROUTES.public.home);
      return;
    }
    setDeletingId(productId);
    deleteMutation.mutate({ storeId, productId }, { onSettled: () => setDeletingId(null) });
  }

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (isError) {
    return (
      <p className="py-12 text-center text-sm text-destructive" role="alert">
        {t("loadError")}
      </p>
    );
  }

  return (
    <CatalogList
      products={products}
      onEdit={handleEdit}
      onDelete={handleDelete}
      deletingId={deletingId}
    />
  );
}
