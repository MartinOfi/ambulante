"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildHref, ROUTES } from "@/shared/constants/routes";
import { useSession } from "@/shared/hooks/useSession";
import { useCatalogQuery } from "@/features/catalog/hooks/useCatalogQuery";
import { useDeleteProductMutation } from "@/features/catalog/hooks/useDeleteProductMutation";
import { CatalogList } from "./CatalogList";

export function CatalogListContainer() {
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
    if (!storeId) return;
    setDeletingId(productId);
    deleteMutation.mutate({ storeId, productId }, { onSettled: () => setDeletingId(null) });
  }

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Cargando catálogo…</p>;
  }

  if (isError) {
    return (
      <p className="py-12 text-center text-sm text-destructive" role="alert">
        No se pudo cargar el catálogo. Intentá de nuevo más tarde.
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
