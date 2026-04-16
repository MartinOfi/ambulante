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
import { loginSchema, type LoginValues } from "@/features/auth/schemas/auth.schemas";
import { ROUTES } from "@/shared/constants/routes";

interface LoginFormProps {
  readonly onSubmit: (values: LoginValues) => Promise<void>;
  readonly isLoading: boolean;
  readonly serverError: string | null;
}

export function LoginForm({ onSubmit, isLoading, serverError }: LoginFormProps) {
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
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
          {isLoading ? "Iniciando sesión…" : "Iniciar sesión"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          <Link
            href={ROUTES.auth.forgotPassword}
            className="underline underline-offset-4 hover:text-foreground"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          ¿No tenés cuenta?{" "}
          <Link
            href={ROUTES.auth.register}
            className="underline underline-offset-4 hover:text-foreground"
          >
            Registrate
          </Link>
        </p>
      </form>
    </Form>
  );
}
