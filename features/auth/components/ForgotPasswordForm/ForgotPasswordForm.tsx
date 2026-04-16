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
import type { ForgotPasswordValues } from "@/features/auth/schemas/auth.schemas";
import { ROUTES } from "@/shared/constants/routes";

interface ForgotPasswordFormProps {
  readonly form: UseFormReturn<ForgotPasswordValues>;
  readonly onSubmit: (values: ForgotPasswordValues) => Promise<void>;
  readonly isLoading: boolean;
  readonly submitted: boolean;
}

export function ForgotPasswordForm({
  form,
  onSubmit,
  isLoading,
  submitted,
}: ForgotPasswordFormProps) {
  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-foreground">
          Si ese email está registrado, te enviamos un enlace para restablecer tu contraseña.
        </p>
        <Link href={ROUTES.auth.login} className="text-xs text-brand underline underline-offset-4">
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Ingresá tu email y te enviamos un enlace para recuperar tu contraseña.
        </p>

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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Enviando…" : "Enviar enlace"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          <Link
            href={ROUTES.auth.login}
            className="underline underline-offset-4 hover:text-foreground"
          >
            Volver al inicio de sesión
          </Link>
        </p>
      </form>
    </Form>
  );
}
