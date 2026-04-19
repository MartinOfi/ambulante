import Link from "next/link";
import { ROUTES } from "@/shared/constants/routes";
import { CreateProductFormContainer } from "@/features/catalog/components/ProductForm";

// Route is protected by middleware (role: store). When Supabase is integrated, add
// server-side ownership verification: ensure session.user.id matches a real Store record.
export default function NewProductPage() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.store.catalog}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          ← Catálogo
        </Link>
        <h1 className="text-xl font-semibold">Nuevo producto</h1>
      </div>

      <CreateProductFormContainer />
    </div>
  );
}
