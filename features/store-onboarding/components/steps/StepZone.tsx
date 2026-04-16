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
  stepZoneSchema,
  type StepZoneValues,
} from "@/features/store-onboarding/schemas/store-onboarding.schemas";

interface StepZoneProps {
  readonly defaultValues?: Partial<StepZoneValues>;
  readonly onNext: (values: StepZoneValues) => void;
  readonly onBack: () => void;
}

export function StepZone({ defaultValues, onNext, onBack }: StepZoneProps) {
  const form = useForm<StepZoneValues>({
    resolver: zodResolver(stepZoneSchema),
    defaultValues: {
      neighborhood: "",
      coverageNotes: "",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
        <FormField
          control={form.control}
          name="neighborhood"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Barrio donde operás</FormLabel>
              <FormControl>
                <Input placeholder="Palermo, San Telmo…" {...field} />
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
                <Input placeholder="Ej: Plaza Dorrego los domingos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
            Atrás
          </Button>
          <Button type="submit" className="flex-1">
            Siguiente
          </Button>
        </div>
      </form>
    </Form>
  );
}
