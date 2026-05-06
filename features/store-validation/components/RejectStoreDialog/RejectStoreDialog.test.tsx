import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RejectStoreDialog } from "./RejectStoreDialog";

describe("RejectStoreDialog", () => {
  it("renders the dialog when open is true", () => {
    render(
      <RejectStoreDialog open={true} isSubmitting={false} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render dialog content when open is false", () => {
    render(
      <RejectStoreDialog
        open={false}
        isSubmitting={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const onCancel = vi.fn();

    render(
      <RejectStoreDialog
        open={true}
        isSubmitting={false}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when Escape is pressed", () => {
    const onCancel = vi.fn();

    render(
      <RejectStoreDialog
        open={true}
        isSubmitting={false}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.keyDown(document.body, { key: "Escape" });

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("shows a validation error when submitting with a short reason", async () => {
    render(
      <RejectStoreDialog open={true} isSubmitting={false} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "corto" } });
    fireEvent.click(screen.getByRole("button", { name: /confirmar rechazo/i }));

    await waitFor(() => {
      expect(screen.getByText(/al menos/i)).toBeInTheDocument();
    });
  });

  it("calls onConfirm with the reason when form is valid", async () => {
    const onConfirm = vi.fn();

    render(
      <RejectStoreDialog
        open={true}
        isSubmitting={false}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    const validReason = "Documentación incompleta y fotos de baja calidad";
    fireEvent.change(screen.getByRole("textbox"), { target: { value: validReason } });
    fireEvent.click(screen.getByRole("button", { name: /confirmar rechazo/i }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(validReason);
    });
  });

  it("disables the confirm button while isSubmitting is true", () => {
    render(
      <RejectStoreDialog open={true} isSubmitting={true} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: /confirmar rechazo/i })).toBeDisabled();
  });

  it("disables the cancel button while isSubmitting is true", () => {
    render(
      <RejectStoreDialog open={true} isSubmitting={true} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: /cancelar/i })).toBeDisabled();
  });

  it("moves focus into the dialog when opened", async () => {
    render(
      <RejectStoreDialog open={true} isSubmitting={false} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );

    await waitFor(() => {
      expect(document.activeElement).not.toBe(document.body);
    });
    expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
  });
});
