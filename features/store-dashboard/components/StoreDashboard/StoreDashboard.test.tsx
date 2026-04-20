import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { render } from "@/shared/test-utils";
import { ORDER_STATUS } from "@/shared/constants/order";
import type { Order } from "@/shared/schemas/order";
import { StoreDashboard } from "./StoreDashboard";

const MOCK_ORDER_ENVIADO: Order = {
  id: "order-enviado-1",
  clientId: "client-1",
  storeId: "store-1",
  status: ORDER_STATUS.ENVIADO,
  items: [{ productId: "p1", productName: "Empanada", productPriceArs: 500, quantity: 2 }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const MOCK_ORDER_FINALIZADO: Order = {
  id: "order-finalizado-1",
  clientId: "client-1",
  storeId: "store-1",
  status: ORDER_STATUS.FINALIZADO,
  items: [{ productId: "p2", productName: "Choripán", productPriceArs: 1200, quantity: 1 }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEFAULT_PROPS = {
  isAvailable: false,
  locationStatus: "idle" as const,
  incomingOrders: [],
  isLoadingOrders: false,
  onToggleAvailability: vi.fn(),
};

describe("StoreDashboard", () => {
  it("renders availability toggle", () => {
    render(<StoreDashboard {...DEFAULT_PROPS} />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("calls onToggleAvailability when toggle is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<StoreDashboard {...DEFAULT_PROPS} onToggleAvailability={onToggle} />);

    await user.click(screen.getByRole("switch"));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("shows loading state while fetching orders", () => {
    render(<StoreDashboard {...DEFAULT_PROPS} isLoadingOrders />);
    expect(screen.getByText(/cargando pedidos/i)).toBeInTheDocument();
  });

  it("shows empty message when no incoming orders", () => {
    render(<StoreDashboard {...DEFAULT_PROPS} incomingOrders={[]} />);
    expect(screen.getByText(/no hay pedidos pendientes/i)).toBeInTheDocument();
  });

  it("renders only ENVIADO and RECIBIDO orders, filters out terminal ones", () => {
    render(
      <StoreDashboard
        {...DEFAULT_PROPS}
        incomingOrders={[MOCK_ORDER_ENVIADO, MOCK_ORDER_FINALIZADO]}
      />,
    );
    expect(screen.getByText("Enviado")).toBeInTheDocument();
    expect(screen.queryByText("Finalizado")).not.toBeInTheDocument();
  });

  it("renders quick-access links", () => {
    render(<StoreDashboard {...DEFAULT_PROPS} />);
    expect(screen.getByRole("link", { name: /catálogo/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pedidos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /perfil/i })).toBeInTheDocument();
  });

  it("marks switch as checked when store is available", () => {
    render(<StoreDashboard {...DEFAULT_PROPS} isAvailable />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });
});
