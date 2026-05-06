import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SuspendConfirmDialog } from "./SuspendConfirmDialog";

const defaultProps = {
  userEmail: "test@example.com",
  reason: "",
  isPending: false,
  errorMessage: null,
  onReasonChange: vi.fn(),
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe("SuspendConfirmDialog", () => {
  it("renders when isOpen is true", () => {
    render(<SuspendConfirmDialog {...defaultProps} isOpen={true} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    render(<SuspendConfirmDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the user email in the description", () => {
    render(<SuspendConfirmDialog {...defaultProps} isOpen={true} />);
    expect(screen.getByText(/test@example\.com/)).toBeInTheDocument();
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(<SuspendConfirmDialog {...defaultProps} isOpen={true} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when Escape is pressed", () => {
    const onCancel = vi.fn();
    render(<SuspendConfirmDialog {...defaultProps} isOpen={true} onCancel={onCancel} />);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("disables the confirm button when reason is too short", () => {
    render(<SuspendConfirmDialog {...defaultProps} isOpen={true} reason="ab" />);
    expect(screen.getByRole("button", { name: /sí, suspender/i })).toBeDisabled();
  });

  it("enables the confirm button when reason is long enough", () => {
    render(<SuspendConfirmDialog {...defaultProps} isOpen={true} reason="motivo válido" />);
    expect(screen.getByRole("button", { name: /sí, suspender/i })).not.toBeDisabled();
  });

  it("calls onConfirm when the confirm button is clicked with a valid reason", () => {
    const onConfirm = vi.fn();
    render(
      <SuspendConfirmDialog
        {...defaultProps}
        isOpen={true}
        reason="motivo válido"
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /sí, suspender/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("disables both buttons while isPending", () => {
    render(<SuspendConfirmDialog {...defaultProps} isOpen={true} isPending={true} />);
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /suspendiendo/i })).toBeDisabled();
  });

  it("shows error message when errorMessage is set", () => {
    render(<SuspendConfirmDialog {...defaultProps} isOpen={true} errorMessage="Error de red" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Error de red");
  });

  it("moves focus into the dialog when opened", async () => {
    render(<SuspendConfirmDialog {...defaultProps} isOpen={true} />);
    await waitFor(() => {
      expect(document.activeElement).not.toBe(document.body);
    });
    expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
  });
});
