import { getTranslations } from "next-intl/server";
import { KpiDashboardContainer } from "@/features/admin-kpi-dashboard";

export default async function AdminDashboardPage() {
  const t = await getTranslations("Pages.AdminDashboard");

  return (
    <main className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <KpiDashboardContainer />
    </main>
  );
}
