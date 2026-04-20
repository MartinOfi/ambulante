import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/shared/components/ui/button";
import { ROUTES } from "@/shared/constants/routes";
import { CatalogListContainer } from "@/features/catalog/components/CatalogList";

export default async function CatalogPage() {
  const t = await getTranslations("Pages.StoreCatalog");

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <Button asChild size="sm">
          <Link href={ROUTES.store.catalogNew}>{t("addProduct")}</Link>
        </Button>
      </div>

      <CatalogListContainer />
    </div>
  );
}
