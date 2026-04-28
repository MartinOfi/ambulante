import Link from "next/link";
import { ROUTES } from "@/shared/constants/routes";

export const metadata = { title: "Error de autenticación — Ambulante" };

const ERROR_MESSAGES: Record<string, { title: string; body: string }> = {
  missing_code: {
    title: "Enlace inválido",
    body: "El enlace que seguiste no tiene los datos necesarios para iniciar sesión. Pedí uno nuevo.",
  },
  exchange_failed: {
    title: "Error al iniciar sesión",
    body: "No pudimos completar el inicio de sesión. El enlace puede haber sido usado antes o ser inválido.",
  },
  missing_token: {
    title: "Enlace incompleto",
    body: "El enlace de confirmación está incompleto. Revisá tu bandeja de entrada y usá el enlace completo.",
  },
  link_expired: {
    title: "Enlace expirado",
    body: "Este enlace ya no es válido. Los enlaces de acceso expiran después de 1 hora. Podés pedir uno nuevo.",
  },
  already_confirmed: {
    title: "Cuenta ya confirmada",
    body: "Tu cuenta ya fue confirmada anteriormente. Podés iniciar sesión directamente.",
  },
  confirmation_failed: {
    title: "Error de confirmación",
    body: "No pudimos confirmar tu cuenta. Intentá de nuevo o contactanos si el problema persiste.",
  },
};

const DEFAULT_ERROR = {
  title: "Error de autenticación",
  body: "Ocurrió un error inesperado. Intentá de nuevo.",
};

interface AuthErrorPageProps {
  readonly searchParams: Promise<{ reason?: string }>;
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { reason } = await searchParams;
  const resolved = reason != null ? ERROR_MESSAGES[reason] : undefined;
  const { title, body } = resolved ?? DEFAULT_ERROR;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 dark:bg-surface px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-sm border border-zinc-100 dark:border-zinc-800 text-center">
        <p className="font-display text-3xl font-bold text-brand mb-1">Ambulante</p>
        <p className="text-xs font-medium tracking-widest uppercase text-zinc-400 mb-8">
          Tu mercado en movimiento
        </p>

        <div className="mb-6 flex justify-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 text-2xl">
            ✕
          </span>
        </div>

        <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-3">{title}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">{body}</p>

        <div className="flex flex-col gap-3">
          <Link
            href={ROUTES.auth.login}
            className="inline-flex w-full items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand/90 transition-colors"
          >
            Ir a iniciar sesión
          </Link>
          <Link
            href={ROUTES.auth.forgotPassword}
            className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Pedir nuevo enlace de acceso
          </Link>
        </div>
      </div>
    </div>
  );
}
