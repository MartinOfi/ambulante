import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResetPasswordFormContainer } from "./ResetPasswordForm.container";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: vi.fn(),
}));

import { useSearchParams } from "next/navigation";

function mockToken(token: string | null) {
  vi.mocked(useSearchParams).mockReturnValue({
    get: (key: string) => (key === "token" ? token : null),
  } as ReturnType<typeof useSearchParams>);
}

describe("ResetPasswordFormContainer", () => {
  beforeEach(() => {
    cleanup();
    mockToken("valid-reset-token-abcdef123");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows invalid-link error when token is absent", () => {
    mockToken(null);
    render(<ResetPasswordFormContainer />);

    expect(screen.getByRole("alert")).toHaveTextContent(/inválido o expiró/i);
  });

  it("renders password fields when token is present", () => {
    render(<ResetPasswordFormContainer />);

    expect(screen.getByLabelText(/nueva contraseña/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /restablecer contraseña/i })).toBeInTheDocument();
  });

  it("shows success message after passwords are reset", async () => {
    render(<ResetPasswordFormContainer />);

    await userEvent.type(screen.getByLabelText(/nueva contraseña/i), "newsecure1");
    await userEvent.type(screen.getByLabelText(/confirmar contraseña/i), "newsecure1");
    await userEvent.click(screen.getByRole("button", { name: /restablecer contraseña/i }));

    await waitFor(
      () => {
        expect(screen.getByText(/contraseña fue restablecida/i)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
});
