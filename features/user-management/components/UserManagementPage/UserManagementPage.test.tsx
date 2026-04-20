import { render, screen, fireEvent } from "@/shared/test-utils";
import { describe, it, expect, vi } from "vitest";
import React from "react";

import { USER_ROLES } from "@/shared/constants/user";
import type { User } from "@/shared/schemas/user";
import { UserManagementPage } from "./UserManagementPage";

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
  suspendDialogEmail: null,
  isSuspendPending: false,
  onSuspendRequest: vi.fn(),
  onSuspendConfirm: vi.fn(),
  onSuspendCancel: vi.fn(),
  onReinstate: vi.fn(),
};

describe("UserManagementPage", () => {
  it("renders the page heading", () => {
    render(<UserManagementPage {...DEFAULT_PROPS} />);

    expect(screen.getByRole("heading", { name: /gestión de usuarios/i })).toBeInTheDocument();
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
    expect(screen.getByText(/no se pudo cargar los usuarios/i)).toBeInTheDocument();
  });

  it("does not render an error alert when errorMessage is null", () => {
    render(<UserManagementPage {...DEFAULT_PROPS} errorMessage={null} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("calls onSuspendRequest when the Suspender button is clicked", () => {
    const onSuspendRequest = vi.fn();
    render(<UserManagementPage {...DEFAULT_PROPS} onSuspendRequest={onSuspendRequest} />);

    fireEvent.click(screen.getByRole("button", { name: /suspender usuario cliente@test.com/i }));

    expect(onSuspendRequest).toHaveBeenCalledWith("user-1");
  });

  it("calls onReinstate when the Reactivar button is clicked", () => {
    const onReinstate = vi.fn();
    render(<UserManagementPage {...DEFAULT_PROPS} onReinstate={onReinstate} />);

    fireEvent.click(screen.getByRole("button", { name: /reactivar usuario tienda@test.com/i }));

    expect(onReinstate).toHaveBeenCalledWith("user-2");
  });

  it("renders the confirm dialog when suspendDialogEmail is set", () => {
    render(<UserManagementPage {...DEFAULT_PROPS} suspendDialogEmail="cliente@test.com" />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent("cliente@test.com");
  });

  it("does not render the confirm dialog when suspendDialogEmail is null", () => {
    render(<UserManagementPage {...DEFAULT_PROPS} suspendDialogEmail={null} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onSuspendConfirm when the dialog confirm button is clicked", () => {
    const onSuspendConfirm = vi.fn();
    render(
      <UserManagementPage
        {...DEFAULT_PROPS}
        suspendDialogEmail="cliente@test.com"
        onSuspendConfirm={onSuspendConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /sí, suspender/i }));

    expect(onSuspendConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onSuspendCancel when the dialog cancel button is clicked", () => {
    const onSuspendCancel = vi.fn();
    render(
      <UserManagementPage
        {...DEFAULT_PROPS}
        suspendDialogEmail="cliente@test.com"
        onSuspendCancel={onSuspendCancel}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(onSuspendCancel).toHaveBeenCalledTimes(1);
  });
});
