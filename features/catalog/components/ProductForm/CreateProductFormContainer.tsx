"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/constants/routes";
import { useSession } from "@/shared/hooks/useSession";
import {
  createProductSchema,
  type CreateProductValues,
} from "@/features/catalog/schemas/catalog.schemas";
import { useCreateProductMutation } from "@/features/catalog/hooks/useCreateProductMutation";
import { ProductForm } from "./ProductForm";

export function CreateProductFormContainer() {
  const t = useTranslations("Catalog.CreateForm");
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
    if (!storeId) {
      setServerError(t("sessionExpired"));
      return;
    }
    setServerError(null);
    try {
      await createMutation.mutateAsync({ storeId, values });
      router.push(ROUTES.store.catalog);
    } catch {
      setServerError(t("createError"));
    }
  }

  return (
    <ProductForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={createMutation.isPending}
      serverError={serverError}
      submitLabel={t("submit")}
    />
  );
}
