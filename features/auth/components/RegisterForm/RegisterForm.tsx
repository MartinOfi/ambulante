"use client";

import type { UseFormReturn } from "react-hook-form";
import Link from "next/link";
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
import type { RegisterValues } from "@/features/auth/schemas/auth.schemas";
import { ROUTES } from "@/shared/constants/routes";
import { USER_ROLES } from "@/shared/constants/user";

interface RegisterFormProps {
  readonly form: UseFormReturn<RegisterValues>;
  readonly onSubmit: (values: RegisterValues) => Promise<void>;
  readonly isLoading: boolean;
  readonly serverError: string | null;
}

export function RegisterForm({ form, onSubmit, isLoading, serverError }: RegisterFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="tu@email.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de cuenta</FormLabel>
              <FormControl>
                <select
                  aria-label="Tipo de cuenta"
                  className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  {...field}
                >
                  <option value={USER_ROLES.client}>Cliente</option>
                  <option value={USER_ROLES.store}>Tienda</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <p className="text-xs font-medium text-destructive" role="alert">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creando cuenta…" : "Crear cuenta"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          ¿Ya tenés cuenta?{" "}
          <Link
            href={ROUTES.auth.login}
            className="underline underline-offset-4 hover:text-foreground"
          >
            Iniciá sesión
          </Link>
        </p>
      </form>
    </Form>
  );
}
