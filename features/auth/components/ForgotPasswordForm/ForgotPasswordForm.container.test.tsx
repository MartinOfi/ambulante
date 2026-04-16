import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ForgotPasswordFormContainer } from "./ForgotPasswordForm.container";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("ForgotPasswordFormContainer", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders the email input and submit button", () => {
    render(<ForgotPasswordFormContainer />);

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviar enlace/i })).toBeInTheDocument();
  });

  it("shows success message after submit completes", async () => {
    render(<ForgotPasswordFormContainer />);

    await userEvent.type(screen.getByLabelText(/correo electrónico/i), "user@test.com");
    await userEvent.click(screen.getByRole("button", { name: /enviar enlace/i }));

    await waitFor(
      () => {
        expect(screen.getByText(/si ese email está registrado/i)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
});
