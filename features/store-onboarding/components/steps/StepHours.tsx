"use client";

import { useForm, Controller } from "react-hook-form";
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
  stepHoursSchema,
  STORE_ONBOARDING_DAYS,
  type StepHoursValues,
  type OnboardingDay,
} from "@/features/store-onboarding/schemas/store-onboarding.schemas";

const DAY_LABELS: Record<OnboardingDay, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
};

interface StepHoursProps {
  readonly defaultValues?: Partial<StepHoursValues>;
  readonly onNext: (values: StepHoursValues) => void;
  readonly onBack: () => void;
  readonly isLoading?: boolean;
}

export function StepHours({ defaultValues, onNext, onBack, isLoading = false }: StepHoursProps) {
  const form = useForm<StepHoursValues>({
    resolver: zodResolver(stepHoursSchema),
    defaultValues: {
      days: [],
      openTime: "09:00",
      closeTime: "18:00",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
        <Controller
          control={form.control}
          name="days"
          render={({ field, fieldState }) => (
            <FormItem>
              <label className="text-sm font-medium leading-none">Días de operación</label>
              <div className="flex flex-wrap gap-2">
                {STORE_ONBOARDING_DAYS.map((day) => {
                  const selected = field.value.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        const next = selected
                          ? field.value.filter((d) => d !== day)
                          : [...field.value, day];
                        field.onChange(next);
                      }}
                      className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                        selected
                          ? "border-brand bg-brand text-white"
                          : "border-border bg-surface text-foreground hover:bg-muted"
                      }`}
                    >
                      {DAY_LABELS[day]}
                    </button>
                  );
                })}
              </div>
              {fieldState.error && (
                <p className="text-xs font-medium text-destructive">{fieldState.error.message}</p>
              )}
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
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

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onBack}
            disabled={isLoading}
          >
            Atrás
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? "Enviando…" : "Enviar solicitud"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
