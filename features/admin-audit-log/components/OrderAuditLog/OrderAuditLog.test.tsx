import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderAuditLog } from "./OrderAuditLog";
import type { AuditLogResult } from "@/features/admin-audit-log/types/audit-log.types";
import { ORDER_STATUS } from "@/shared/constants/order";
import { ORDER_ACTOR } from "@/shared/domain/order-state-machine";

const mockResult: AuditLogResult = {
  orderId: "order-abc-123",
  entries: [
    {
      eventType: "SISTEMA_RECIBE",
      newStatus: ORDER_STATUS.RECIBIDO,
      actor: ORDER_ACTOR.SISTEMA,
      occurredAt: new Date("2024-01-15T10:00:00Z"),
    },
  ],
};

describe("OrderAuditLog", () => {
  it("renders the search form", () => {
    render(
      <OrderAuditLog result={undefined} isSearching={false} error={null} onSearch={vi.fn()} />,
    );

    expect(screen.getByRole("textbox", { name: /id del pedido/i })).toBeInTheDocument();
  });

  it("shows idle state before any search", () => {
    render(
      <OrderAuditLog result={undefined} isSearching={false} error={null} onSearch={vi.fn()} />,
    );

    expect(screen.getByText(/ingresá el id de un pedido/i)).toBeInTheDocument();
  });

  it("shows loading skeleton while searching", () => {
    render(<OrderAuditLog result={undefined} isSearching={true} error={null} onSearch={vi.fn()} />);

    expect(screen.getByTestId("audit-log-loading")).toBeInTheDocument();
  });

  it("shows error message when search fails", () => {
    render(
      <OrderAuditLog
        result={null}
        isSearching={false}
        error="No se encontró el pedido"
        onSearch={vi.fn()}
      />,
    );

    expect(screen.getByText(/no se encontró el pedido/i)).toBeInTheDocument();
  });

  it("shows not-found message when service returned null (order not found)", () => {
    render(<OrderAuditLog result={null} isSearching={false} error={null} onSearch={vi.fn()} />);

    expect(screen.getByText(/no se encontraron transiciones/i)).toBeInTheDocument();
  });

  it("shows empty timeline message when result has no entries", () => {
    render(
      <OrderAuditLog
        result={{ orderId: "order-xyz", entries: [] }}
        isSearching={false}
        error={null}
        onSearch={vi.fn()}
      />,
    );

    expect(screen.getByText(/sin transiciones registradas/i)).toBeInTheDocument();
  });

  it("renders timeline when result has entries", () => {
    render(
      <OrderAuditLog result={mockResult} isSearching={false} error={null} onSearch={vi.fn()} />,
    );

    expect(screen.getByText(/order-abc-123/i)).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
  });
});
