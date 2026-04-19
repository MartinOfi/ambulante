"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { ProductCardProps } from "./ProductCard.types";

export function ProductCard({ product, onEdit, onDelete, isDeleting = false }: ProductCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{product.name}</CardTitle>
          <Badge variant={product.isAvailable ? "default" : "secondary"}>
            {product.isAvailable ? "Disponible" : "No disponible"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-2">
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        )}
        <p className="mt-1 text-lg font-semibold">${product.priceArs.toLocaleString("es-AR")}</p>
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          aria-label={`Editar ${product.name}`}
          onClick={() => onEdit(product.id)}
          disabled={isDeleting}
        >
          <Pencil className="mr-1 h-3 w-3" />
          Editar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1"
          aria-label={`Eliminar ${product.name}`}
          onClick={() => onDelete(product.id)}
          disabled={isDeleting}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          {isDeleting ? "Eliminando…" : "Eliminar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
