"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/constants/routes";
import { useSession } from "@/shared/hooks/useSession";
import {
  createProductSchema,
  type CreateProductValues,
} from "@/features/catalog/schemas/catalog.schemas";
import { useCreateProductMutation } from "@/features/catalog/hooks/useCreateProductMutation";
import { ProductForm } from "./ProductForm";

export function CreateProductFormContainer() {
  const router = useRouter();
  const sessionState = useSession();
  const storeId = sessionState.status === "authenticated" ? sessionState.session.user.id : "";

  const createMutation = useCreateProductMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CreateProductValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { name: "", priceArs: 0, photoUrl: "", isAvailable: true },
  });

  async function handleSubmit(values: CreateProductValues): Promise<void> {
    if (!storeId) return;
    setServerError(null);

    await new Promise<void>((resolve) => {
      createMutation.mutate(
        { storeId, values },
        {
          onSuccess: () => {
            router.push(ROUTES.store.catalog);
            resolve();
          },
          onError: () => {
            setServerError("No se pudo crear el producto. Intentá de nuevo.");
            resolve();
          },
        },
      );
    });
  }

  return (
    <ProductForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={createMutation.isPending}
      serverError={serverError}
      submitLabel="Crear producto"
    />
  );
}
