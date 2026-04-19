"use client";

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
import type { ProductFormProps } from "./ProductForm.types";

export function ProductForm({
  form,
  onSubmit,
  isLoading,
  serverError,
  submitLabel,
}: ProductFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del producto</FormLabel>
              <FormControl>
                <Input placeholder="Empanada de carne" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <textarea
                  placeholder="Breve descripción del producto…"
                  maxLength={300}
                  rows={3}
                  className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priceArs"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio (ARS)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="500"
                  {...field}
                  onChange={(e) => {
                    const v = e.target.valueAsNumber;
                    field.onChange(Number.isNaN(v) ? "" : v);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="photoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de foto (opcional)</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isAvailable"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
              </FormControl>
              <FormLabel className="!mt-0">Disponible</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <p className="text-xs font-medium text-destructive" role="alert">
            {serverError}
          </p>
        )}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando…" : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
