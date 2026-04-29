"use client";

import { USER_ROLES } from "@/shared/constants/user";
import { SUSPENSION_STATUS } from "@/shared/domain/user-suspension";
import type { RoleFilter, StatusFilter, UserFiltersBarProps } from "./UserFiltersBar.types";

const ROLE_OPTIONS: ReadonlyArray<{ value: RoleFilter; label: string }> = [
  { value: "all", label: "Todos los roles" },
  { value: USER_ROLES.client, label: "Clientes" },
  { value: USER_ROLES.store, label: "Tiendas" },
  { value: USER_ROLES.admin, label: "Admins" },
];

const STATUS_OPTIONS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Todos los estados" },
  { value: SUSPENSION_STATUS.ACTIVE, label: "Activos" },
  { value: SUSPENSION_STATUS.SUSPENDED, label: "Suspendidos" },
];

const SELECT_CLASSES =
  "rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]";

export function UserFiltersBar({
  roleFilter,
  statusFilter,
  searchQuery,
  onRoleChange,
  onStatusChange,
  onSearchChange,
}: UserFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="search"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar por email o nombre…"
        aria-label="Buscar usuario"
        className="min-w-0 flex-1 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
      />
      <select
        value={roleFilter}
        onChange={(event) => onRoleChange(event.target.value as RoleFilter)}
        aria-label="Filtrar por rol"
        className={SELECT_CLASSES}
      >
        {ROLE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        value={statusFilter}
        onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
        aria-label="Filtrar por estado"
        className={SELECT_CLASSES}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
