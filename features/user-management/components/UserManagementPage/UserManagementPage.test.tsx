import { render, screen, fireEvent } from "@/shared/test-utils";
import { describe, it, expect, vi } from "vitest";
import React from "react";

import { USER_ROLES } from "@/shared/constants/user";
import type { User } from "@/shared/schemas/user";
import { UserManagementPage } from "./UserManagementPage";

const VALID_REASON = "Comportamiento abusivo confirmado";

const MOCK_USERS: readonly User[] = [
  {
    id: "user-1",
    email: "cliente@test.com",
    role: USER_ROLES.client,
    displayName: "Ana López",
    suspended: false,
  },
  {
    id: "user-2",
    email: "tienda@test.com",
    role: USER_ROLES.store,
    displayName: "Tienda Ejemplo",
    suspended: true,
  },
];

const DEFAULT_PROPS = {
  users: MOCK_USERS,
  isLoading: false,
  errorMessage: null,
  pendingUserId: null,
  roleFilter: "all" as const,
  statusFilter: "all" as const,
  searchQuery: "",
  suspendDialogEmail: null,
  suspendReason: "",
  isSuspendPending: false,
  suspendErrorMessage: null,
  onRoleChange: vi.fn(),
  onStatusChange: vi.fn(),
  onSearchChange: vi.fn(),
  onSuspendRequest: vi.fn(),
  onSuspendConfirm: vi.fn(),
  onSuspendCancel: vi.fn(),
  onSuspendReasonChange: vi.fn(),
  onReactivate: vi.fn(),
  onView: vi.fn(),
};

describe("UserManagementPage", () => {
  it("renders the page heading", () => {
    render(<UserManagementPage {...DEFAULT_PROPS} />);
    expect(screen.getByRole("heading", { name: /gestión de usuarios/i })).toBeInTheDocument();
  });

  it("renders the filters bar with search input and selects", () => {
    render(<UserManagementPage {...DEFAULT_PROPS} />);
    expect(screen.getByRole("searchbox", { name: /buscar usuario/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /filtrar por rol/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /filtrar por estado/i })).toBeInTheDocument();
  });

  it("renders the user table when not loading", () => {
    render(<UserManagementPage {...DEFAULT_PROPS} />);
    expect(screen.getByText("cliente@test.com")).toBeInTheDocument();
    expect(screen.getByText("tienda@test.com")).toBeInTheDocument();
  });

  it("renders a loading skeleton when isLoading is true", () => {
    render(<UserManagementPage {...DEFAULT_PROPS} isLoading={true} users={[]} />);
    expect(screen.queryByText("cliente@test.com")).not.toBeInTheDocument();
  });

  it("renders an error alert when errorMessage is set", () => {
    render(<UserManagementPage {...DEFAULT_PROPS} errorMessage="No se pudo cargar los usuarios" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("calls onSuspendRequest when the Suspender button is clicked", () => {
    const onSuspendRequest = vi.fn();
    render(<UserManagementPage {...DEFAULT_PROPS} onSuspendRequest={onSuspendRequest} />);

    fireEvent.click(screen.getByRole("button", { name: /suspender usuario cliente@test.com/i }));

    expect(onSuspendRequest).toHaveBeenCalledWith("user-1");
  });

  it("calls onReactivate when the Reactivar button is clicked", () => {
    const onReactivate = vi.fn();
    render(<UserManagementPage {...DEFAULT_PROPS} onReactivate={onReactivate} />);

    fireEvent.click(screen.getByRole("button", { name: /reactivar usuario tienda@test.com/i }));

    expect(onReactivate).toHaveBeenCalledWith("user-2");
  });

  it("calls onView when the Ver button is clicked", () => {
    const onView = vi.fn();
    render(<UserManagementPage {...DEFAULT_PROPS} onView={onView} />);

    fireEvent.click(screen.getByRole("button", { name: /ver detalle de cliente@test.com/i }));

    expect(onView).toHaveBeenCalledWith("user-1");
  });

  it("calls onSearchChange when typing in the search input", () => {
    const onSearchChange = vi.fn();
    render(<UserManagementPage {...DEFAULT_PROPS} onSearchChange={onSearchChange} />);

    fireEvent.change(screen.getByRole("searchbox", { name: /buscar usuario/i }), {
      target: { value: "ana" },
    });

    expect(onSearchChange).toHaveBeenCalledWith("ana");
  });

  it("renders the confirm dialog with reason input when suspendDialogEmail is set", () => {
    render(<UserManagementPage {...DEFAULT_PROPS} suspendDialogEmail="cliente@test.com" />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent("cliente@test.com");
    expect(screen.getByLabelText(/motivo/i)).toBeInTheDocument();
  });

  it("disables confirm when reason is too short", () => {
    render(
      <UserManagementPage
        {...DEFAULT_PROPS}
        suspendDialogEmail="cliente@test.com"
        suspendReason="ab"
      />,
    );

    const confirmBtn = screen.getByRole("button", { name: /sí, suspender/i });
    expect(confirmBtn).toBeDisabled();
  });

  it("enables confirm when reason meets minimum length", () => {
    render(
      <UserManagementPage
        {...DEFAULT_PROPS}
        suspendDialogEmail="cliente@test.com"
        suspendReason={VALID_REASON}
      />,
    );

    const confirmBtn = screen.getByRole("button", { name: /sí, suspender/i });
    expect(confirmBtn).not.toBeDisabled();
  });

  it("calls onSuspendConfirm when confirm button is clicked with valid reason", () => {
    const onSuspendConfirm = vi.fn();
    render(
      <UserManagementPage
        {...DEFAULT_PROPS}
        suspendDialogEmail="cliente@test.com"
        suspendReason={VALID_REASON}
        onSuspendConfirm={onSuspendConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /sí, suspender/i }));

    expect(onSuspendConfirm).toHaveBeenCalledTimes(1);
  });
});
