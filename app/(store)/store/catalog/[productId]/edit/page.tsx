import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/shared/constants/routes";
import { EditProductFormContainer } from "@/features/catalog/components/ProductForm";

// Route is protected by middleware (role: store). When Supabase is integrated, add
// server-side ownership verification: ensure productId belongs to session.user.id's store.

interface EditProductPageProps {
  readonly params: Promise<{ productId: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const [{ productId }, t] = await Promise.all([params, getTranslations("Pages.StoreCatalogEdit")]);

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.store.catalog}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {t("backLink")}
        </Link>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
      </div>

      <EditProductFormContainer productId={productId} />
    </div>
  );
}
