import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/shared/constants/routes";
import { RejectionReasonDisplay } from "./RejectionReasonDisplay";

export const metadata = { title: "Solicitud rechazada — Ambulante" };

export default async function StoreRejectedPage() {
  const t = await getTranslations("Pages.StoreRejected");

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div
        aria-hidden="true"
        className="flex size-16 items-center justify-center rounded-full bg-red-100 text-3xl"
      >
        ✗
      </div>
      <div className="max-w-sm space-y-2">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <RejectionReasonDisplay />
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
