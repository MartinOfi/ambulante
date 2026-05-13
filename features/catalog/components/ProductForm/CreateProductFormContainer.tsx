"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/constants/routes";
import { useCurrentStoreQuery } from "@/shared/hooks/useCurrentStoreQuery";
import {
  createProductSchema,
  type CreateProductValues,
} from "@/features/catalog/schemas/catalog.schemas";
import { useCreateProductMutation } from "@/features/catalog/hooks/useCreateProductMutation";
import { ProductImageUploadContainer } from "@/features/catalog/components/ProductImageUpload";
import { ProductForm } from "./ProductForm";

export function CreateProductFormContainer() {
  const t = useTranslations("Catalog.CreateForm");
  const { push } = useRouter();
  const storeQuery = useCurrentStoreQuery();
  const storeId = storeQuery.data?.id ?? "";

  const createMutation = useCreateProductMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CreateProductValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { name: "", priceArs: 0, photoUrl: "", isAvailable: true },
  });

  async function handleSubmit(values: CreateProductValues): Promise<void> {
    if (!storeId) {
      setServerError(storeQuery.isSuccess ? t("noStore") : t("sessionExpired"));
      return;
    }
    setServerError(null);
    try {
      await createMutation.mutateAsync({ storeId, values });
      push(ROUTES.store.catalog);
    } catch {
      setServerError(t("createError"));
    }
  }

  const photoUrl = form.watch("photoUrl");

  return (
    <ProductForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={createMutation.isPending || storeQuery.isPending}
      serverError={serverError}
      submitLabel={t("submit")}
      imageUploadSlot={
        <ProductImageUploadContainer
          storeId={storeId}
          currentUrl={photoUrl || null}
          onUploaded={(url) => form.setValue("photoUrl", url, { shouldValidate: true })}
        />
      }
    />
  );
}
