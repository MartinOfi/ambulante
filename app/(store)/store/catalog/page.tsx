import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { ROUTES } from "@/shared/constants/routes";
import { CatalogListContainer } from "@/features/catalog/components/CatalogList";

export default function CatalogPage() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mi catálogo</h1>
        <Button asChild size="sm">
          <Link href={ROUTES.store.catalogNew}>+ Agregar producto</Link>
        </Button>
      </div>

      <CatalogListContainer />
    </div>
  );
}
