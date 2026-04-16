"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/features/auth/schemas/auth.schemas";
import { ROUTES } from "@/shared/constants/routes";

interface ResetPasswordFormProps {
  readonly onSubmit: (values: ResetPasswordValues) => Promise<void>;
  readonly isLoading: boolean;
  readonly submitted: boolean;
  readonly token: string;
}

export function ResetPasswordForm({
  onSubmit,
  isLoading,
  submitted,
  token,
}: ResetPasswordFormProps) {
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "", token },
  });

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-foreground">Tu contraseña fue restablecida exitosamente.</p>
        <Link href={ROUTES.auth.login} className="text-xs text-brand underline underline-offset-4">
          Iniciá sesión
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva contraseña</FormLabel>
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Guardando…" : "Restablecer contraseña"}
        </Button>
      </form>
    </Form>
  );
}
