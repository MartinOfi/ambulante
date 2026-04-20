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
  updateStoreProfileSchema,
  PROFILE_DAYS,
  type UpdateStoreProfileInput,
  type StoreProfile,
} from "@/features/store-profile/schemas/store-profile.schemas";
import type { StoreKind } from "@/shared/schemas/store";
import type { StoreProfileFormProps } from "./StoreProfileForm.types";

const STORE_KIND_KEYS: StoreKind[] = ["food-truck", "street-cart", "ice-cream"];

function buildDefaultValues({ storeId: _, ...rest }: StoreProfile): UpdateStoreProfileInput {
  return rest;
}

export function StoreProfileForm({ defaultValues, onSubmit, isPending }: StoreProfileFormProps) {
  const t = useTranslations("StoreProfile.Form");

  const form = useForm<UpdateStoreProfileInput>({
    resolver: zodResolver(updateStoreProfileSchema),
    defaultValues: buildDefaultValues(defaultValues),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          name="neighborhood"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("neighborhoodLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={t("neighborhoodPlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coverageNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("coverageNotesLabel")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("coverageNotesPlaceholder")}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("daysLabel")}</FormLabel>
              <FormControl>
                <div role="group" aria-label={t("daysLabel")} className="flex flex-wrap gap-2">
                  {PROFILE_DAYS.map((day) => {
                    const checked = (field.value ?? []).includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={checked}
                        aria-label={t(`days.${day}`)}
                        onClick={() => {
                          const current = field.value ?? [];
                          const next = checked
                            ? current.filter((d) => d !== day)
                            : [...current, day];
                          field.onChange(next);
                        }}
                        className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                          checked
                            ? "border-brand bg-brand text-white"
                            : "border-border bg-surface text-foreground"
                        }`}
                      >
                        {t(`days.${day}`)}
                      </button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="openTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("openTimeLabel")}</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="closeTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("closeTimeLabel")}</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("saving") : t("save")}
        </Button>
      </form>
    </Form>
  );
}
