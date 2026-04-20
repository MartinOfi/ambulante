import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/shared/constants/routes";

export const metadata = { title: "Solicitud en revisión — Ambulante" };

export default async function PendingApprovalPage() {
  const t = await getTranslations("Pages.PendingApproval");

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl"
      >
        ⏳
      </div>
      <div className="max-w-sm space-y-2">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("needHelp")}{" "}
        <Link
          href={ROUTES.auth.login}
          className="underline underline-offset-4 hover:text-foreground"
        >
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}
