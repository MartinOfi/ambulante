import Link from "next/link";
import { ROUTES } from "@/shared/constants/routes";

export const metadata = { title: "Solicitud en revisión — Ambulante" };

export default function PendingApprovalPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
        ⏳
      </div>
      <div className="max-w-sm space-y-2">
        <h1 className="text-xl font-semibold">Tu solicitud está en revisión</h1>
        <p className="text-sm text-muted-foreground">
          Recibimos los datos de tu tienda. Un administrador los revisará y te notificará cuando tu
          cuenta esté habilitada para operar.
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        ¿Necesitás ayuda?{" "}
        <Link
          href={ROUTES.auth.login}
          className="underline underline-offset-4 hover:text-foreground"
        >
          Volvé al inicio de sesión
        </Link>
      </p>
    </div>
  );
}
