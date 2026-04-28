import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterFormContainer } from "./RegisterForm.container";
import type { AuthService } from "@/shared/services/auth.types";
import type { Session } from "@/shared/types/user";
import { USER_ROLES } from "@/shared/constants/user";
import { ROUTES } from "@/shared/constants/routes";

const mockStoreSession: Session = {
  accessToken: "tok",
  refreshToken: "ref",
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
  user: { id: "2", email: "store@test.com", role: USER_ROLES.store },
};

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function buildMockService(overrides: Partial<AuthService> = {}): AuthService {
  return {
    signIn: vi
      .fn<AuthService["signIn"]>()
      .mockResolvedValue({ success: true, data: mockStoreSession }),
    signUp: vi
      .fn<AuthService["signUp"]>()
      .mockResolvedValue({ success: true, data: mockStoreSession }),
    signOut: vi.fn<AuthService["signOut"]>().mockResolvedValue({ success: true, data: undefined }),
    getSession: vi.fn<AuthService["getSession"]>().mockResolvedValue(null),
    getUser: vi.fn<AuthService["getUser"]>().mockResolvedValue(null),
    signInWithMagicLink: vi
      .fn<AuthService["signInWithMagicLink"]>()
      .mockResolvedValue({ success: true, data: undefined }),
    signInWithGoogle: vi
      .fn<AuthService["signInWithGoogle"]>()
      .mockResolvedValue({ success: false, error: "Google sign-in no disponible en modo mock" }),
    onAuthStateChange: vi.fn<AuthService["onAuthStateChange"]>().mockReturnValue(() => {}),
    ...overrides,
  };
}

describe("RegisterFormContainer", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("calls signUp with form values on submit", async () => {
    const service = buildMockService();
    render(<RegisterFormContainer service={service} />);

    await userEvent.type(screen.getByLabelText(/correo electrónico/i), "new@test.com");
    await userEvent.type(screen.getByLabelText(/^contraseña$/i), "securepass");
    await userEvent.type(screen.getByLabelText(/confirmar contraseña/i), "securepass");
    await userEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(service.signUp).toHaveBeenCalledWith(
        expect.objectContaining({ email: "new@test.com", password: "securepass" }),
      );
    });
  });

  it("shows error when email is already registered", async () => {
    const service = buildMockService({
      signUp: vi.fn().mockResolvedValue({ success: false, error: "El email ya está registrado" }),
    });
    render(<RegisterFormContainer service={service} />);

    await userEvent.type(screen.getByLabelText(/correo electrónico/i), "taken@test.com");
    await userEvent.type(screen.getByLabelText(/^contraseña$/i), "securepass");
    await userEvent.type(screen.getByLabelText(/confirmar contraseña/i), "securepass");
    await userEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(screen.getByText("El email ya está registrado")).toBeInTheDocument();
    });
  });

  it("redirects to store dashboard after successful store registration", async () => {
    const listeners: Array<(session: Session | null) => void> = [];
    const service = buildMockService({
      onAuthStateChange: vi.fn().mockImplementation((cb) => {
        listeners.push(cb);
        return () => {};
      }),
      signUp: vi.fn().mockImplementation(async () => {
        listeners.forEach((cb) => cb(mockStoreSession));
        return { success: true, data: mockStoreSession };
      }),
    });
    render(<RegisterFormContainer service={service} />);

    await userEvent.type(screen.getByLabelText(/correo electrónico/i), "store@test.com");
    await userEvent.type(screen.getByLabelText(/^contraseña$/i), "securepass");
    await userEvent.type(screen.getByLabelText(/confirmar contraseña/i), "securepass");
    await userEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(ROUTES.store.dashboard);
    });
  });
});
