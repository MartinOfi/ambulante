import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/shared/constants/routes";

export default async function NotFound() {
  const t = await getTranslations("Pages.NotFound");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t("description")}</p>
      <Link
        href={ROUTES.public.home}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        {t("backToHome")}
      </Link>
    </div>
  );
}
