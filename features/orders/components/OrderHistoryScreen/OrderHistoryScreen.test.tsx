import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";

import { ORDER_STATUS } from "@/shared/constants/order";
import type { Order } from "@/shared/schemas/order";
import { OrderHistoryScreen } from "./OrderHistoryScreen";

const MOCK_ORDERS: readonly Order[] = [
  {
    id: "order-1",
    clientId: "user-1",
    storeId: "store-1",
    status: ORDER_STATUS.ENVIADO,
    items: [{ productId: "p1", productName: "Empanada", productPriceArs: 500, quantity: 1 }],
    createdAt: "2026-04-19T10:00:00.000Z",
    updatedAt: "2026-04-19T10:00:00.000Z",
  },
  {
    id: "order-2",
    clientId: "user-1",
    storeId: "store-2",
    status: ORDER_STATUS.FINALIZADO,
    items: [{ productId: "p2", productName: "Gaseosa", productPriceArs: 300, quantity: 2 }],
    createdAt: "2026-04-18T15:00:00.000Z",
    updatedAt: "2026-04-18T16:00:00.000Z",
  },
];

describe("OrderHistoryScreen", () => {
  it("renders a card for each order", () => {
    render(
      <OrderHistoryScreen
        orders={MOCK_ORDERS}
        isLoading={false}
        activeStatus={null}
        onStatusChange={() => undefined}
      />,
    );

    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("renders the empty state when orders list is empty", () => {
    render(
      <OrderHistoryScreen
        orders={[]}
        isLoading={false}
        activeStatus={null}
        onStatusChange={() => undefined}
      />,
    );

    expect(screen.getByText(/no tenés pedidos/i)).toBeInTheDocument();
  });

  it("renders a loading skeleton when isLoading is true", () => {
    render(
      <OrderHistoryScreen
        orders={[]}
        isLoading={true}
        activeStatus={null}
        onStatusChange={() => undefined}
      />,
    );

    expect(screen.getByTestId("orders-loading")).toBeInTheDocument();
  });

  it("highlights the active status filter tab", () => {
    render(
      <OrderHistoryScreen
        orders={MOCK_ORDERS}
        isLoading={false}
        activeStatus={ORDER_STATUS.ENVIADO}
        onStatusChange={() => undefined}
      />,
    );

    const activeTab = screen.getByRole("button", { name: ORDER_STATUS.ENVIADO });
    expect(activeTab).toHaveAttribute("aria-pressed", "true");
  });
});
