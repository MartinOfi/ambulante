import { screen } from "@testing-library/react";
import { render } from "@/shared/test-utils";
import { describe, it, expect } from "vitest";
import React from "react";

import { ORDER_STATUS } from "@/shared/constants/order";
import type { Order } from "@/shared/schemas/order";
import { OrderCard } from "./OrderCard";

const MOCK_ORDER: Order = {
  id: "order-abc123",
  clientId: "user-1",
  storeId: "store-1",
  status: ORDER_STATUS.ACEPTADO,
  items: [
    { productId: "p1", productName: "Empanada", productPriceArs: 500, quantity: 2 },
    { productId: "p2", productName: "Gaseosa", productPriceArs: 300, quantity: 1 },
  ],
  createdAt: "2026-04-19T10:30:00.000Z",
  updatedAt: "2026-04-19T10:31:00.000Z",
};

describe("OrderCard", () => {
  it("renders the order id (truncated)", () => {
    render(<OrderCard order={MOCK_ORDER} />);
    expect(screen.getByText(/abc123/i)).toBeInTheDocument();
  });

  it("renders the status badge with human label", () => {
    render(<OrderCard order={MOCK_ORDER} />);
    expect(screen.getByText("Aceptado")).toBeInTheDocument();
    expect(screen.queryByText(ORDER_STATUS.ACEPTADO)).not.toBeInTheDocument();
  });

  it("renders the correct item count", () => {
    render(<OrderCard order={MOCK_ORDER} />);
    expect(screen.getByText(/2 producto/i)).toBeInTheDocument();
  });

  it("renders the creation date", () => {
    render(<OrderCard order={MOCK_ORDER} />);
    expect(screen.getByText(/19\/04\/2026/)).toBeInTheDocument();
  });
});
