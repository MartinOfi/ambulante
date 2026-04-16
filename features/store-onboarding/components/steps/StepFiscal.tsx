"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import {
  stepFiscalSchema,
  type StepFiscalValues,
} from "@/features/store-onboarding/schemas/store-onboarding.schemas";

const STORE_KIND_LABELS: Record<StepFiscalValues["kind"], string> = {
  "food-truck": "Food truck",
  "street-cart": "Puesto callejero",
  "ice-cream": "Heladería ambulante",
};

interface StepFiscalProps {
  readonly defaultValues?: Partial<StepFiscalValues>;
  readonly onNext: (values: StepFiscalValues) => void;
}

export function StepFiscal({ defaultValues, onNext }: StepFiscalProps) {
  const form = useForm<StepFiscalValues>({
    resolver: zodResolver(stepFiscalSchema),
    defaultValues: {
      businessName: "",
      kind: "food-truck",
      cuit: "",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del negocio</FormLabel>
              <FormControl>
                <Input placeholder="El Rincón del Sabor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="kind"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de tienda</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  {...field}
                >
                  {(Object.entries(STORE_KIND_LABELS) as [StepFiscalValues["kind"], string][]).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cuit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CUIT (sin guiones)</FormLabel>
              <FormControl>
                <Input placeholder="20304050607" maxLength={11} inputMode="numeric" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Siguiente
        </Button>
      </form>
    </Form>
  );
}
