import type { UseFormReturn } from "react-hook-form";
import type { CreateProductValues } from "@/features/catalog/schemas/catalog.schemas";

export interface ProductFormProps {
  readonly form: UseFormReturn<CreateProductValues>;
  readonly onSubmit: (values: CreateProductValues) => Promise<void>;
  readonly isLoading: boolean;
  readonly serverError: string | null;
  readonly submitLabel: string;
}
