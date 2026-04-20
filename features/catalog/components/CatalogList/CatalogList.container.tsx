"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { buildHref, ROUTES } from "@/shared/constants/routes";
import { useSession } from "@/shared/hooks/useSession";
import { useCatalogQuery } from "@/features/catalog/hooks/useCatalogQuery";
import { useDeleteProductMutation } from "@/features/catalog/hooks/useDeleteProductMutation";
import { CatalogList } from "./CatalogList";

export function CatalogListContainer() {
  const t = useTranslations("Catalog.List");
  const router = useRouter();
  const sessionState = useSession();
  const storeId = sessionState.status === "authenticated" ? sessionState.session.user.id : "";

  const { data: products = [], isLoading, isError } = useCatalogQuery(storeId);
  const deleteMutation = useDeleteProductMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleEdit(productId: string) {
    router.push(buildHref(ROUTES.store.catalogEdit, { productId }));
  }

  async function handleDelete(productId: string) {
    if (!storeId) {
      router.push(ROUTES.public.home);
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
