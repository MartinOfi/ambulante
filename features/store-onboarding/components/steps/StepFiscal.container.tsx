"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
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

const STORE_KIND_KEYS: StepFiscalValues["kind"][] = ["food-truck", "street-cart", "ice-cream"];

interface StepFiscalProps {
  readonly defaultValues?: Partial<StepFiscalValues>;
  readonly onNext: (values: StepFiscalValues) => void;
}

export function StepFiscal({ defaultValues, onNext }: StepFiscalProps) {
  const t = useTranslations("StoreOnboarding.StepFiscal");

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
      <form onSubmit={form.handleSubmit((data) => onNext(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("businessNameLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={t("businessNamePlaceholder")} {...field} />
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
              <FormLabel>{t("storeKindLabel")}</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  {...field}
                >
                  {STORE_KIND_KEYS.map((value) => (
                    <option key={value} value={value}>
                      {t(`storeKinds.${value}`)}
                    </option>
                  ))}
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
              <FormLabel>{t("cuitLabel")}</FormLabel>
              <FormControl>
                <Input placeholder="20304050607" maxLength={11} inputMode="numeric" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {t("next")}
        </Button>
      </form>
    </Form>
  );
}
