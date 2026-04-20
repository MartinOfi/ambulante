import { getTranslations } from "next-intl/server";

export default async function AdminDashboardPage() {
  const t = await getTranslations("Pages.AdminDashboard");

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mt-2">{t("comingSoon")}</p>
    </main>
  );
}
