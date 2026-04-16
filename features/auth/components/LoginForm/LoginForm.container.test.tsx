import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginFormContainer } from "./LoginForm.container";
import type { AuthService } from "@/shared/services/auth.types";
import type { Session } from "@/shared/types/user";
import { USER_ROLES } from "@/shared/constants/user";
import { ROUTES } from "@/shared/constants/routes";

const mockSession: Session = {
  accessToken: "tok",
  refreshToken: "ref",
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
  user: { id: "1", email: "client@test.com", role: USER_ROLES.client },
};

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function buildMockService(overrides: Partial<AuthService> = {}): AuthService {
  return {
    signIn: vi.fn<AuthService["signIn"]>().mockResolvedValue({ success: true, data: mockSession }),
    signUp: vi.fn<AuthService["signUp"]>().mockResolvedValue({ success: true, data: mockSession }),
    signOut: vi.fn<AuthService["signOut"]>().mockResolvedValue({ success: true, data: undefined }),
    getSession: vi.fn<AuthService["getSession"]>().mockResolvedValue(null),
    onAuthStateChange: vi.fn<AuthService["onAuthStateChange"]>().mockReturnValue(() => {}),
    ...overrides,
  };
}

describe("LoginFormContainer", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("calls signIn with form values on submit", async () => {
    const service = buildMockService();
    render(<LoginFormContainer service={service} />);

    await userEvent.type(screen.getByLabelText(/correo electrónico/i), "client@test.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "password");
    await userEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(service.signIn).toHaveBeenCalledWith({
        email: "client@test.com",
        password: "password",
      });
    });
  });

  it("shows server error when signIn fails", async () => {
    const service = buildMockService({
      signIn: vi.fn().mockResolvedValue({ success: false, error: "Credenciales inválidas" }),
    });
    render(<LoginFormContainer service={service} />);

    await userEvent.type(screen.getByLabelText(/correo electrónico/i), "wrong@test.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText("Credenciales inválidas")).toBeInTheDocument();
    });
  });

  it("redirects to /map after successful client login", async () => {
    const listeners: Array<(session: Session | null) => void> = [];
    const service = buildMockService({
      onAuthStateChange: vi.fn().mockImplementation((cb) => {
        listeners.push(cb);
        return () => {};
      }),
      signIn: vi.fn().mockImplementation(async () => {
        listeners.forEach((cb) => cb(mockSession));
        return { success: true, data: mockSession };
      }),
    });
    render(<LoginFormContainer service={service} />);

    await userEvent.type(screen.getByLabelText(/correo electrónico/i), "client@test.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "password");
    await userEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(ROUTES.client.map);
    });
  });
});
