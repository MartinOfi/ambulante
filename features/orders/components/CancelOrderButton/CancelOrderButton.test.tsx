import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CancelOrderButton } from "./CancelOrderButton";

const noop = () => undefined;

describe("CancelOrderButton", () => {
  it("renders the initial cancel button", () => {
    render(
      <CancelOrderButton
        isConfirming={false}
        isLoading={false}
        onCancelClick={noop}
        onConfirmCancel={noop}
        onDismissConfirm={noop}
      />,
    );

    expect(screen.getByRole("button", { name: /cancelar pedido/i })).toBeInTheDocument();
  });

  it("calls onCancelClick when the cancel button is pressed", async () => {
    const onCancelClick = vi.fn();
    render(
      <CancelOrderButton
        isConfirming={false}
        isLoading={false}
        onCancelClick={onCancelClick}
        onConfirmCancel={noop}
        onDismissConfirm={noop}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /cancelar pedido/i }));
    expect(onCancelClick).toHaveBeenCalledOnce();
  });

  it("renders confirmation UI when isConfirming is true", () => {
    render(
      <CancelOrderButton
        isConfirming={true}
        isLoading={false}
        onCancelClick={noop}
        onConfirmCancel={noop}
        onDismissConfirm={noop}
      />,
    );

    expect(screen.getByText(/¿cancelar tu pedido\?/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sí, cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /no, volver/i })).toBeInTheDocument();
  });

  it("calls onConfirmCancel when confirm button is pressed", async () => {
    const onConfirmCancel = vi.fn();
    render(
      <CancelOrderButton
        isConfirming={true}
        isLoading={false}
        onCancelClick={noop}
        onConfirmCancel={onConfirmCancel}
        onDismissConfirm={noop}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /sí, cancelar/i }));
    expect(onConfirmCancel).toHaveBeenCalledOnce();
  });

  it("calls onDismissConfirm when dismiss button is pressed", async () => {
    const onDismissConfirm = vi.fn();
    render(
      <CancelOrderButton
        isConfirming={true}
        isLoading={false}
        onCancelClick={noop}
        onConfirmCancel={noop}
        onDismissConfirm={onDismissConfirm}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /no, volver/i }));
    expect(onDismissConfirm).toHaveBeenCalledOnce();
  });

  it("disables both confirm buttons when isLoading is true", () => {
    render(
      <CancelOrderButton
        isConfirming={true}
        isLoading={true}
        onCancelClick={noop}
        onConfirmCancel={noop}
        onDismissConfirm={noop}
      />,
    );

    expect(screen.getByRole("button", { name: /cancelando/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /no, volver/i })).toBeDisabled();
  });

  it("shows loading label on confirm button when isLoading is true", () => {
    render(
      <CancelOrderButton
        isConfirming={true}
        isLoading={true}
        onCancelClick={noop}
        onConfirmCancel={noop}
        onDismissConfirm={noop}
      />,
    );

    expect(screen.getByText(/cancelando/i)).toBeInTheDocument();
  });

  it("displays errorMessage when provided", () => {
    render(
      <CancelOrderButton
        isConfirming={false}
        isLoading={false}
        errorMessage="No se pudo cancelar el pedido. Intentá de nuevo."
        onCancelClick={noop}
        onConfirmCancel={noop}
        onDismissConfirm={noop}
      />,
    );

    expect(screen.getByText(/no se pudo cancelar el pedido/i)).toBeInTheDocument();
  });

  it("does not display error area when errorMessage is undefined", () => {
    render(
      <CancelOrderButton
        isConfirming={false}
        isLoading={false}
        onCancelClick={noop}
        onConfirmCancel={noop}
        onDismissConfirm={noop}
      />,
    );

    expect(screen.queryByText(/no se pudo/i)).not.toBeInTheDocument();
  });
});
