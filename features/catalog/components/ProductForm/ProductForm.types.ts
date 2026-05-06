import type React from "react";
import type { UseFormReturn } from "react-hook-form";
import type {
  CreateProductValues,
  EditProductValues,
} from "@/features/catalog/schemas/catalog.schemas";

type ProductFormValues = CreateProductValues | EditProductValues;

export interface ProductFormProps {
  readonly form: UseFormReturn<ProductFormValues>;
  readonly onSubmit: (values: ProductFormValues) => Promise<void>;
  readonly isLoading: boolean;
  readonly serverError: string | null;
  readonly submitLabel: string;
  readonly imageUploadSlot: React.ReactNode;
}
