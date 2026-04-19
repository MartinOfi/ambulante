import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { ORDER_STATUS } from "@/shared/constants/order";
import type { Order } from "@/shared/schemas/order";
import { OrderTracking } from "./OrderTracking";

const BASE_ORDER: Omit<Order, "status"> = {
  id: "order-1",
  clientId: "client-1",
  storeId: "store-1",
  items: [{ productId: "p1", productName: "Empanada", productPriceArs: 500, quantity: 2 }],
  createdAt: "2026-04-19T10:00:00.000Z",
  updatedAt: "2026-04-19T10:00:00.000Z",
};

const DEFAULT_PROPS = {
  onConfirmOnTheWay: vi.fn(),
  onCancel: vi.fn(),
  isCancelling: false,
  isConfirmingOnTheWay: false,
};

function renderTracking(status: Order["status"]) {
  const order: Order = { ...BASE_ORDER, status };
  return render(<OrderTracking order={order} {...DEFAULT_PROPS} />);
}

describe("OrderTracking — timeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all 5 main flow steps", () => {
    renderTracking(ORDER_STATUS.ENVIADO);

    expect(screen.getByTestId(`step-${ORDER_STATUS.ENVIADO}`)).toBeInTheDocument();
    expect(screen.getByTestId(`step-${ORDER_STATUS.RECIBIDO}`)).toBeInTheDocument();
    expect(screen.getByTestId(`step-${ORDER_STATUS.ACEPTADO}`)).toBeInTheDocument();
    expect(screen.getByTestId(`step-${ORDER_STATUS.EN_CAMINO}`)).toBeInTheDocument();
    expect(screen.getByTestId(`step-${ORDER_STATUS.FINALIZADO}`)).toBeInTheDocument();
  });

  it("marks the current status step as current", () => {
    renderTracking(ORDER_STATUS.ACEPTADO);

    const step = screen.getByTestId(`step-${ORDER_STATUS.ACEPTADO}`);
    expect(step).toHaveAttribute("data-current", "true");
  });

  it("marks steps before the current one as completed", () => {
    renderTracking(ORDER_STATUS.ACEPTADO);

    expect(screen.getByTestId(`step-${ORDER_STATUS.ENVIADO}`)).toHaveAttribute(
      "data-completed",
      "true",
    );
    expect(screen.getByTestId(`step-${ORDER_STATUS.RECIBIDO}`)).toHaveAttribute(
      "data-completed",
      "true",
    );
    expect(screen.getByTestId(`step-${ORDER_STATUS.EN_CAMINO}`)).toHaveAttribute(
      "data-completed",
      "false",
    );
  });
});

describe("OrderTracking — CTAs", () => {
  it("shows cancel button for ENVIADO status", () => {
    renderTracking(ORDER_STATUS.ENVIADO);
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /camino/i })).not.toBeInTheDocument();
  });

  it("shows cancel button for RECIBIDO status", () => {
    renderTracking(ORDER_STATUS.RECIBIDO);
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
  });

  it("shows confirm-on-the-way button for ACEPTADO and no cancel", () => {
    renderTracking(ORDER_STATUS.ACEPTADO);
    expect(screen.getByRole("button", { name: /camino/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancelar/i })).not.toBeInTheDocument();
  });

  it("shows no CTA buttons for EN_CAMINO", () => {
    renderTracking(ORDER_STATUS.EN_CAMINO);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onCancel when cancel button clicked", async () => {
    const onCancel = vi.fn();
    const order: Order = { ...BASE_ORDER, status: ORDER_STATUS.ENVIADO };
    render(<OrderTracking order={order} {...DEFAULT_PROPS} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onConfirmOnTheWay when confirm button clicked", async () => {
    const onConfirmOnTheWay = vi.fn();
    const order: Order = { ...BASE_ORDER, status: ORDER_STATUS.ACEPTADO };
    render(
      <OrderTracking order={order} {...DEFAULT_PROPS} onConfirmOnTheWay={onConfirmOnTheWay} />,
    );

    await userEvent.click(screen.getByRole("button", { name: /camino/i }));
    expect(onConfirmOnTheWay).toHaveBeenCalledOnce();
  });
});

describe("OrderTracking — terminal states", () => {
  it("shows no buttons for FINALIZADO", () => {
    renderTracking(ORDER_STATUS.FINALIZADO);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows terminal message for CANCELADO", () => {
    renderTracking(ORDER_STATUS.CANCELADO);
    expect(screen.getByText(/cancelado/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows terminal message for RECHAZADO", () => {
    renderTracking(ORDER_STATUS.RECHAZADO);
    expect(screen.getByText(/rechazado/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows terminal message for EXPIRADO", () => {
    renderTracking(ORDER_STATUS.EXPIRADO);
    expect(screen.getByText(/expirado/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
