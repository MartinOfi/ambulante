import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminShell } from "./AdminShell";
import type { User } from "@/shared/types/user";

const ADMIN_USER: User = {
  id: "user-1",
  email: "admin@example.com",
  role: "admin",
  displayName: "Admin User",
};

const baseProps = {
  isSidebarOpen: true,
  onToggleSidebar: vi.fn(),
  user: ADMIN_USER,
  onSignOut: vi.fn(),
  children: <main data-testid="page-content">content</main>,
};

describe("AdminShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page content", () => {
    render(<AdminShell {...baseProps} />);
    expect(screen.getByTestId("page-content")).toBeInTheDocument();
  });

  it("renders the user display name in the header", () => {
    render(<AdminShell {...baseProps} />);
    expect(screen.getByText("Admin User")).toBeInTheDocument();
  });

  it("falls back to email when displayName is undefined", () => {
    const user = { ...ADMIN_USER, displayName: undefined };
    render(<AdminShell {...baseProps} user={user} />);
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
  });

  it("calls onSignOut when sign-out button is clicked", () => {
    render(<AdminShell {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /cerrar sesión/i }));
    expect(baseProps.onSignOut).toHaveBeenCalledOnce();
  });

  it("shows sidebar nav links when sidebar is open", () => {
    render(<AdminShell {...baseProps} isSidebarOpen={true} />);
    expect(screen.getByRole("navigation", { name: /admin/i })).toBeVisible();
  });

  it("calls onToggleSidebar when toggle button is clicked", () => {
    render(<AdminShell {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /menú/i }));
    expect(baseProps.onToggleSidebar).toHaveBeenCalledOnce();
  });

  it("renders the Dashboard nav link", () => {
    render(<AdminShell {...baseProps} />);
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute(
      "href",
      "/admin/dashboard",
    );
  });
});
