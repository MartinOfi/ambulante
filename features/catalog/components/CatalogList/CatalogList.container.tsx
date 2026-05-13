"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { buildHref, ROUTES } from "@/shared/constants/routes";
import { useCurrentStoreQuery } from "@/shared/hooks/useCurrentStoreQuery";
import { useCatalogQuery } from "@/features/catalog/hooks/useCatalogQuery";
import { useDeleteProductMutation } from "@/features/catalog/hooks/useDeleteProductMutation";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { CatalogList } from "./CatalogList";

export function CatalogListContainer() {
  const t = useTranslations("Catalog.List");
  const { push } = useRouter();
  const storeQuery = useCurrentStoreQuery();
  const storeId = storeQuery.data?.id ?? "";

  const { data: products = [], isLoading, isError } = useCatalogQuery(storeId);
  const deleteMutation = useDeleteProductMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function handleEdit(productId: string) {
    push(buildHref(ROUTES.store.catalogEdit, { productId }));
  }

  function handleDeleteRequest(productId: string) {
    if (!storeId) {
      push(ROUTES.public.home);
      return;
    }
    setPendingDeleteId(productId);
  }

  function handleConfirmDelete() {
    if (!pendingDeleteId || !storeId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setDeletingId(id);
    deleteMutation.mutate(
      { storeId, productId: id },
      {
        onSuccess: () => toast.success("Producto eliminado"),
        onSettled: () => setDeletingId(null),
      },
    );
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
    <>
      <CatalogList
        products={products}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        deletingId={deletingId}
      />

      <Dialog open={pendingDeleteId !== null} onOpenChange={() => setPendingDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Confirmar eliminación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
