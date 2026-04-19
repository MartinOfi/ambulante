"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/constants/routes";
import { useSession } from "@/shared/hooks/useSession";
import { useCatalogQuery } from "@/features/catalog/hooks/useCatalogQuery";
import { useUpdateProductMutation } from "@/features/catalog/hooks/useUpdateProductMutation";
import {
  editProductSchema,
  type EditProductValues,
} from "@/features/catalog/schemas/catalog.schemas";
import { ProductForm } from "./ProductForm";

interface EditProductFormContainerProps {
  readonly productId: string;
}

export function EditProductFormContainer({ productId }: EditProductFormContainerProps) {
  const router = useRouter();
  const sessionState = useSession();
  const storeId = sessionState.status === "authenticated" ? sessionState.session.user.id : "";

  const { data: products, isLoading } = useCatalogQuery(storeId);
  const updateMutation = useUpdateProductMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const product = products?.find((item) => item.id === productId);

  const form = useForm<EditProductValues>({
    resolver: zodResolver(editProductSchema),
    defaultValues: { name: "", priceArs: 0, photoUrl: "", isAvailable: true },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description ?? "",
        priceArs: product.priceArs,
        photoUrl: product.photoUrl ?? "",
        isAvailable: product.isAvailable,
      });
    }
  }, [product, form]);

  async function handleSubmit(values: EditProductValues): Promise<void> {
    if (!storeId) {
      setServerError("Sesión expirada. Volvé a iniciar sesión.");
      return;
    }
    setServerError(null);
    try {
      await updateMutation.mutateAsync({ storeId, productId, values });
      router.push(ROUTES.store.catalog);
    } catch {
      setServerError("No se pudo actualizar el producto. Intentá de nuevo.");
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando producto…</p>;
  }

  if (!product) {
    return (
      <p className="text-sm text-destructive" role="alert">
        Producto no encontrado.
      </p>
    );
  }

  return (
    <ProductForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={updateMutation.isPending}
      serverError={serverError}
      submitLabel="Guardar cambios"
    />
  );
}
