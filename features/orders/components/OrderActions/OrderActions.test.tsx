import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, userEvent } from "@/shared/test-utils";
import { ORDER_STATUS } from "@/shared/constants/order";
import type { Order } from "@/shared/domain/order-state-machine";
import { OrderActions } from "./OrderActions";

const BASE_ORDER: Omit<Order, "status"> = {
  id: "order-1",
  clientId: "client-1",
  storeId: "store-1",
  sentAt: new Date("2026-04-16T10:00:00Z"),
};

const ORDER_RECIBIDO: Order = {
  ...BASE_ORDER,
  status: ORDER_STATUS.RECIBIDO,
  receivedAt: new Date("2026-04-16T10:00:05Z"),
};

const ORDER_EN_CAMINO: Order = {
  ...BASE_ORDER,
  status: ORDER_STATUS.EN_CAMINO,
  receivedAt: new Date("2026-04-16T10:00:05Z"),
  acceptedAt: new Date("2026-04-16T10:01:00Z"),
  onTheWayAt: new Date("2026-04-16T10:05:00Z"),
};

const ORDER_FINALIZADO: Order = {
  ...BASE_ORDER,
  status: ORDER_STATUS.FINALIZADO,
  receivedAt: new Date("2026-04-16T10:00:05Z"),
  acceptedAt: new Date("2026-04-16T10:01:00Z"),
  onTheWayAt: new Date("2026-04-16T10:05:00Z"),
  finishedAt: new Date("2026-04-16T10:30:00Z"),
};

describe("OrderActions (dumb component)", () => {
  const mockOnAccept = vi.fn();
  const mockOnReject = vi.fn();
  const mockOnFinalize = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Aceptar and Rechazar buttons for RECIBIDO order", () => {
    renderWithProviders(
      <OrderActions
        order={ORDER_RECIBIDO}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onFinalize={mockOnFinalize}
        isAcceptPending={false}
        isRejectPending={false}
        isFinalizePending={false}
      />,
    );

    expect(screen.getByRole("button", { name: /aceptar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rechazar/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /finalizar/i })).not.toBeInTheDocument();
  });

  it("renders Finalizar button for EN_CAMINO order", () => {
    renderWithProviders(
      <OrderActions
        order={ORDER_EN_CAMINO}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onFinalize={mockOnFinalize}
        isAcceptPending={false}
        isRejectPending={false}
        isFinalizePending={false}
      />,
    );

    expect(screen.getByRole("button", { name: /finalizar/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /aceptar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /rechazar/i })).not.toBeInTheDocument();
  });

  it("renders no action buttons for terminal order (FINALIZADO)", () => {
    renderWithProviders(
      <OrderActions
        order={ORDER_FINALIZADO}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onFinalize={mockOnFinalize}
        isAcceptPending={false}
        isRejectPending={false}
        isFinalizePending={false}
      />,
    );

    expect(screen.queryByRole("button", { name: /aceptar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /rechazar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /finalizar/i })).not.toBeInTheDocument();
  });

  it("calls onAccept when Aceptar is clicked", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <OrderActions
        order={ORDER_RECIBIDO}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onFinalize={mockOnFinalize}
        isAcceptPending={false}
        isRejectPending={false}
        isFinalizePending={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /aceptar/i }));
    expect(mockOnAccept).toHaveBeenCalledOnce();
  });

  it("calls onReject when Rechazar is clicked", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <OrderActions
        order={ORDER_RECIBIDO}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onFinalize={mockOnFinalize}
        isAcceptPending={false}
        isRejectPending={false}
        isFinalizePending={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /rechazar/i }));
    expect(mockOnReject).toHaveBeenCalledOnce();
  });

  it("calls onFinalize when Finalizar is clicked", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <OrderActions
        order={ORDER_EN_CAMINO}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onFinalize={mockOnFinalize}
        isAcceptPending={false}
        isRejectPending={false}
        isFinalizePending={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /finalizar/i }));
    expect(mockOnFinalize).toHaveBeenCalledOnce();
  });

  it("disables Aceptar button when isAcceptPending is true", () => {
    renderWithProviders(
      <OrderActions
        order={ORDER_RECIBIDO}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onFinalize={mockOnFinalize}
        isAcceptPending={true}
        isRejectPending={false}
        isFinalizePending={false}
      />,
    );

    expect(screen.getByRole("button", { name: /aceptar/i })).toBeDisabled();
  });

  it("disables Rechazar button when isRejectPending is true", () => {
    renderWithProviders(
      <OrderActions
        order={ORDER_RECIBIDO}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onFinalize={mockOnFinalize}
        isAcceptPending={false}
        isRejectPending={true}
        isFinalizePending={false}
      />,
    );

    expect(screen.getByRole("button", { name: /rechazar/i })).toBeDisabled();
  });

  it("disables Finalizar button when isFinalizePending is true", () => {
    renderWithProviders(
      <OrderActions
        order={ORDER_EN_CAMINO}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onFinalize={mockOnFinalize}
        isAcceptPending={false}
        isRejectPending={false}
        isFinalizePending={true}
      />,
    );

    expect(screen.getByRole("button", { name: /finalizar/i })).toBeDisabled();
  });
});
