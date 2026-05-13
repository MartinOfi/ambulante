import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";

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

describe("IncomingOrdersInbox", () => {
  it("renders empty state when no orders", () => {
    renderWithProviders(<IncomingOrdersInbox orders={[]} isLoading={false} />);
    expect(screen.getByText(/no hay pedidos/i)).toBeInTheDocument();
  });

  it("renders loading state", () => {
    renderWithProviders(<IncomingOrdersInbox orders={[]} isLoading={true} />);
    expect(screen.getByText(/cargando pedidos/i)).toBeInTheDocument();
  });

  it("renders all orders as links", () => {
    renderWithProviders(
      <IncomingOrdersInbox
        orders={[ORDER_ENVIADO, ORDER_RECIBIDO, ORDER_ACEPTADO]}
        isLoading={false}
      />,
    );
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("links point to the order detail page", () => {
    renderWithProviders(<IncomingOrdersInbox orders={[ORDER_RECIBIDO]} isLoading={false} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", `/store/order/${ORDER_RECIBIDO.id}`);
  });

  it("shows order count badge", () => {
    renderWithProviders(
      <IncomingOrdersInbox orders={[ORDER_ENVIADO, ORDER_RECIBIDO]} isLoading={false} />,
    );
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
