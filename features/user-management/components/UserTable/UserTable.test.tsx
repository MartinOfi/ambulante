import { render, screen, fireEvent } from "@/shared/test-utils";
import { describe, it, expect, vi } from "vitest";
import React from "react";

import { USER_ROLES } from "@/shared/constants/user";
import type { User } from "@/shared/schemas/user";
import { UserTable } from "./UserTable";

const ACTIVE_CLIENT: User = {
  id: "user-1",
  email: "cliente@test.com",
  role: USER_ROLES.client,
  displayName: "Ana López",
  suspended: false,
};

const SUSPENDED_STORE: User = {
  id: "user-2",
  email: "tienda@test.com",
  role: USER_ROLES.store,
  displayName: "Tienda Ejemplo",
  suspended: true,
};

const ADMIN_USER: User = {
  id: "user-3",
  email: "admin@test.com",
  role: USER_ROLES.admin,
  displayName: "Admin",
  suspended: false,
};

describe("UserTable", () => {
  it("renders an empty state when no users are provided", () => {
    render(<UserTable users={[]} pendingUserId={null} onSuspend={vi.fn()} onReactivate={vi.fn()} onView={vi.fn()} />);

    expect(screen.getByText(/no hay usuarios para mostrar/i)).toBeInTheDocument();
  });

  it("renders a row for each user", () => {
    render(
      <UserTable
        users={[ACTIVE_CLIENT, SUSPENDED_STORE]}
        pendingUserId={null}
        onSuspend={vi.fn()}
        onReactivate={vi.fn()} onView={vi.fn()}
      />,
    );

    expect(screen.getByText("cliente@test.com")).toBeInTheDocument();
    expect(screen.getByText("tienda@test.com")).toBeInTheDocument();
  });

  it("shows Suspender button for active users", () => {
    render(
      <UserTable
        users={[ACTIVE_CLIENT]}
        pendingUserId={null}
        onSuspend={vi.fn()}
        onReactivate={vi.fn()} onView={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /suspender usuario cliente@test.com/i }),
    ).toBeInTheDocument();
  });

  it("shows Reactivar button for suspended users", () => {
    render(
      <UserTable
        users={[SUSPENDED_STORE]}
        pendingUserId={null}
        onSuspend={vi.fn()}
        onReactivate={vi.fn()} onView={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /reactivar usuario tienda@test.com/i }),
    ).toBeInTheDocument();
  });

  it("disables the Suspender button for admin users", () => {
    render(
      <UserTable
        users={[ADMIN_USER]}
        pendingUserId={null}
        onSuspend={vi.fn()}
        onReactivate={vi.fn()} onView={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /suspender usuario admin@test.com/i }),
    ).toBeDisabled();
  });

  it("calls onSuspend with the user id when Suspender is clicked", () => {
    const onSuspend = vi.fn();
    render(
      <UserTable
        users={[ACTIVE_CLIENT]}
        pendingUserId={null}
        onSuspend={onSuspend}
        onReactivate={vi.fn()} onView={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /suspender usuario cliente@test.com/i }));

    expect(onSuspend).toHaveBeenCalledWith("user-1");
  });

  it("calls onReinstate with the user id when Reactivar is clicked", () => {
    const onReinstate = vi.fn();
    render(
      <UserTable
        users={[SUSPENDED_STORE]}
        pendingUserId={null}
        onSuspend={vi.fn()}
        onReactivate={onReinstate} onView={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /reactivar usuario tienda@test.com/i }));

    expect(onReinstate).toHaveBeenCalledWith("user-2");
  });

  it("disables the action button and shows Procesando when the user is pending", () => {
    render(
      <UserTable
        users={[ACTIVE_CLIENT]}
        pendingUserId="user-1"
        onSuspend={vi.fn()}
        onReactivate={vi.fn()} onView={vi.fn()}
      />,
    );

    const btn = screen.getByRole("button", { name: /suspender usuario cliente@test.com/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent("Procesando…");
  });

  it("shows the Suspendido badge for suspended users", () => {
    render(
      <UserTable
        users={[SUSPENDED_STORE]}
        pendingUserId={null}
        onSuspend={vi.fn()}
        onReactivate={vi.fn()} onView={vi.fn()}
      />,
    );

    expect(screen.getByText("Suspendido")).toBeInTheDocument();
  });

  it("shows the Activo badge for active users", () => {
    render(
      <UserTable
        users={[ACTIVE_CLIENT]}
        pendingUserId={null}
        onSuspend={vi.fn()}
        onReactivate={vi.fn()} onView={vi.fn()}
      />,
    );

    expect(screen.getByText("Activo")).toBeInTheDocument();
  });
});
