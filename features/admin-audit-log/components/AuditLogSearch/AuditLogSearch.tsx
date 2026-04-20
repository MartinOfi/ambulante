"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { orderIdSearchSchema } from "@/features/admin-audit-log/schemas/audit-log.schemas";
import type { OrderIdSearchValues } from "@/features/admin-audit-log/types/audit-log.types";
import type { AuditLogSearchProps } from "./AuditLogSearch.types";

export function AuditLogSearch({ onSearch, isSearching }: AuditLogSearchProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderIdSearchValues>({
    resolver: zodResolver(orderIdSearchSchema),
    defaultValues: { orderId: "" },
  });

  function onSubmit(values: OrderIdSearchValues) {
    onSearch(values.orderId.trim());
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2" noValidate>
      <div className="flex gap-2">
        <div className="flex-1">
          <label
            htmlFor="audit-order-id"
            className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]"
          >
            ID del pedido
          </label>
          <Input
            id="audit-order-id"
            type="text"
            placeholder="ej. order-demo-completed"
            autoComplete="off"
            disabled={isSearching}
            aria-describedby={errors.orderId ? "audit-order-id-error" : undefined}
            {...register("orderId")}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={isSearching} className="gap-2">
            <Search size={16} aria-hidden="true" />
            {isSearching ? "Buscando..." : "Buscar"}
          </Button>
        </div>
      </div>
      {errors.orderId && (
        <p
          id="audit-order-id-error"
          role="alert"
          className="text-sm text-[hsl(var(--destructive))]"
        >
          {errors.orderId.message}
        </p>
      )}
    </form>
  );
}
