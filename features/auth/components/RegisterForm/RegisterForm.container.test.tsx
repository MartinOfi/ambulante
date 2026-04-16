import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterFormContainer } from "./RegisterForm.container";
import type { AuthService } from "@/shared/services/auth.types";
import type { Session } from "@/shared/types/user";

const mockStoreSession: Session = {
  accessToken: "tok",
  refreshToken: "ref",
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
  user: { id: "2", email: "store@test.com", role: "store" },
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function buildMockService(overrides?: Partial<AuthService>): AuthService {
  return {
    signIn: vi.fn(),
    signUp: vi.fn().mockResolvedValue({ success: true, data: mockStoreSession }),
    signOut: vi.fn(),
    getSession: vi.fn().mockResolvedValue(null),
    onAuthStateChange: vi.fn().mockReturnValue(() => {}),
    ...overrides,
  } as unknown as AuthService;
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
});
