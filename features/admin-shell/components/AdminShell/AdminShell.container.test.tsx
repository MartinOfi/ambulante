import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminShellContainer } from "./AdminShell.container";
import type { User } from "@/shared/types/user";

vi.mock("@/shared/stores/ui", () => ({
  useUIStore: vi.fn(
    (selector: (s: { isSidebarOpen: boolean; toggleSidebar: () => void }) => unknown) =>
      selector({ isSidebarOpen: true, toggleSidebar: vi.fn() }),
  ),
}));

vi.mock("@/shared/hooks/useSession");

const mockSignOut = vi.fn();
const ADMIN_USER: User = {
  id: "u-1",
  email: "admin@test.com",
  role: "admin",
  displayName: "Admin",
};

import { useSession } from "@/shared/hooks/useSession";
const mockUseSession = vi.mocked(useSession);

describe("AdminShellContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a loading spinner while session loads", () => {
    mockUseSession.mockReturnValue({
      status: "loading",
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: mockSignOut,
    } as ReturnType<typeof useSession>);

    render(<AdminShellContainer>content</AdminShellContainer>);

    expect(screen.queryByText("content")).not.toBeInTheDocument();
    // spinner is present (animate-spin element)
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders an error message when session errors", () => {
    mockUseSession.mockReturnValue({
      status: "error",
      error: "session error",
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: mockSignOut,
    } as ReturnType<typeof useSession>);

    render(<AdminShellContainer>content</AdminShellContainer>);

    expect(screen.getByText(/error al cargar la sesión/i)).toBeInTheDocument();
    expect(screen.queryByText("content")).not.toBeInTheDocument();
  });

  it("renders nothing when unauthenticated", () => {
    mockUseSession.mockReturnValue({
      status: "unauthenticated",
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: mockSignOut,
    } as ReturnType<typeof useSession>);

    const { container } = render(<AdminShellContainer>content</AdminShellContainer>);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders children when authenticated", () => {
    mockUseSession.mockReturnValue({
      status: "authenticated",
      session: { user: ADMIN_USER, accessToken: "tok", refreshToken: "ref", expiresAt: 9999999999 },
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: mockSignOut,
    } as ReturnType<typeof useSession>);

    render(
      <AdminShellContainer>
        <span data-testid="page">page content</span>
      </AdminShellContainer>,
    );

    expect(screen.getByTestId("page")).toBeInTheDocument();
  });
});
