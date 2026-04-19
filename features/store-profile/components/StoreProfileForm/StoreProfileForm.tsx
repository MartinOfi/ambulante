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
  updateStoreProfileSchema,
  PROFILE_DAYS,
  type UpdateStoreProfileInput,
  type StoreProfile,
  type ProfileDay,
} from "@/features/store-profile/schemas/store-profile.schemas";
import type { StoreKind } from "@/shared/schemas/store";
import type { StoreProfileFormProps } from "./StoreProfileForm.types";

const STORE_KIND_LABELS: Record<StoreKind, string> = {
  "food-truck": "Food truck",
  "street-cart": "Puesto callejero",
  "ice-cream": "Heladería ambulante",
};

const DAY_LABELS: Record<ProfileDay, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
};

function buildDefaultValues({ storeId: _, ...rest }: StoreProfile): UpdateStoreProfileInput {
  return rest;
}

export function StoreProfileForm({ defaultValues, onSubmit, isPending }: StoreProfileFormProps) {
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
                  {(Object.entries(STORE_KIND_LABELS) as [StoreKind, string][]).map(
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
          name="neighborhood"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Barrio operativo</FormLabel>
              <FormControl>
                <Input placeholder="Palermo" {...field} />
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
              <FormLabel>Notas de cobertura (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Zona SoHo y Hollywood" {...field} value={field.value ?? ""} />
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
              <FormLabel>Días de operación</FormLabel>
              <FormControl>
                <div role="group" aria-label="Días de operación" className="flex flex-wrap gap-2">
                  {PROFILE_DAYS.map((day) => {
                    const checked = (field.value ?? []).includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={checked}
                        aria-label={day}
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
                        {DAY_LABELS[day]}
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
                <FormLabel>Apertura</FormLabel>
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
                <FormLabel>Cierre</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </form>
    </Form>
  );
}
