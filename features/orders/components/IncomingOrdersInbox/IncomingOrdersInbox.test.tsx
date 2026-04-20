import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/shared/test-utils/render";
import type { Order } from "@/shared/schemas/order";
import { ORDER_STATUS } from "@/shared/constants/order";
import { IncomingOrdersInbox } from "./IncomingOrdersInbox";

function makeOrder(id: string, status: string, createdAt: string): Order {
  return {
    id,
    clientId: "client-1",
    storeId: "store-1",
    status: status as Order["status"],
    items: [{ productId: "p1", productName: "Empanada", productPriceArs: 500, quantity: 2 }],
    createdAt,
    updatedAt: createdAt,
    notes: id === "o1" ? "Sin picante" : undefined,
  };
}

const ORDER_ENVIADO = makeOrder("o1", ORDER_STATUS.ENVIADO, "2026-04-20T10:00:00.000Z");
const ORDER_RECIBIDO = makeOrder("o2", ORDER_STATUS.RECIBIDO, "2026-04-20T09:00:00.000Z");
const ORDER_ACEPTADO = makeOrder("o3", ORDER_STATUS.ACEPTADO, "2026-04-20T08:00:00.000Z");

const noop = vi.fn();

describe("IncomingOrdersInbox", () => {
  it("renders empty state when no orders", () => {
    renderWithProviders(
      <IncomingOrdersInbox
        orders={[]}
        isLoading={false}
        onAccept={noop}
        onReject={noop}
        onFinalize={noop}
        pendingOrderId={null}
      />,
    );

    expect(screen.getByText(/no hay pedidos/i)).toBeInTheDocument();
  });

  it("renders loading state", () => {
    renderWithProviders(
      <IncomingOrdersInbox
        orders={[]}
        isLoading={true}
        onAccept={noop}
        onReject={noop}
        onFinalize={noop}
        pendingOrderId={null}
      />,
    );

    expect(screen.getByText(/cargando pedidos/i)).toBeInTheDocument();
  });

  it("renders all orders", () => {
    renderWithProviders(
      <IncomingOrdersInbox
        orders={[ORDER_ENVIADO, ORDER_RECIBIDO, ORDER_ACEPTADO]}
        isLoading={false}
        onAccept={noop}
        onReject={noop}
        onFinalize={noop}
        pendingOrderId={null}
      />,
    );

    expect(screen.getAllByRole("article")).toHaveLength(3);
  });

  it("calls onAccept with orderId when Aceptar is clicked on RECIBIDO order", async () => {
    const onAccept = vi.fn();
    renderWithProviders(
      <IncomingOrdersInbox
        orders={[ORDER_RECIBIDO]}
        isLoading={false}
        onAccept={onAccept}
        onReject={noop}
        onFinalize={noop}
        pendingOrderId={null}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /aceptar/i }));

    expect(onAccept).toHaveBeenCalledWith(ORDER_RECIBIDO.id);
  });

  it("calls onReject with orderId when Rechazar is clicked", async () => {
    const onReject = vi.fn();
    renderWithProviders(
      <IncomingOrdersInbox
        orders={[ORDER_RECIBIDO]}
        isLoading={false}
        onAccept={noop}
        onReject={onReject}
        onFinalize={noop}
        pendingOrderId={null}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /rechazar/i }));

    expect(onReject).toHaveBeenCalledWith(ORDER_RECIBIDO.id);
  });

  it("shows order count badge", () => {
    renderWithProviders(
      <IncomingOrdersInbox
        orders={[ORDER_ENVIADO, ORDER_RECIBIDO]}
        isLoading={false}
        onAccept={noop}
        onReject={noop}
        onFinalize={noop}
        pendingOrderId={null}
      />,
    );

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("disables buttons for the pending order", () => {
    renderWithProviders(
      <IncomingOrdersInbox
        orders={[ORDER_RECIBIDO]}
        isLoading={false}
        onAccept={noop}
        onReject={noop}
        onFinalize={noop}
        pendingOrderId={ORDER_RECIBIDO.id}
      />,
    );

    expect(screen.getByRole("button", { name: /aceptar/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /rechazar/i })).toBeDisabled();
  });
});
