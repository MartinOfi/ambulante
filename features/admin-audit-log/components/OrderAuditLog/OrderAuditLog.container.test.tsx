import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/shared/test-utils/render";
import { OrderAuditLogContainer } from "./OrderAuditLog.container";
import * as auditLogMockModule from "@/features/admin-audit-log/services/audit-log.mock";
import { ORDER_STATUS } from "@/shared/constants/order";
import { ORDER_ACTOR } from "@/shared/domain/order-state-machine";
import type { AuditLogResult } from "@/features/admin-audit-log/types/audit-log.types";

const mockResult: AuditLogResult = {
  orderId: "order-demo-completed",
  entries: [
    {
      eventType: "SISTEMA_RECIBE",
      newStatus: ORDER_STATUS.RECIBIDO,
      actor: ORDER_ACTOR.SISTEMA,
      occurredAt: new Date("2024-01-15T10:00:00Z"),
    },
  ],
};

describe("OrderAuditLogContainer", () => {
  beforeEach(() => {
    vi.spyOn(auditLogMockModule.auditLogService, "findByOrderId").mockResolvedValue(mockResult);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the search form on mount", () => {
    renderWithProviders(<OrderAuditLogContainer />);

    expect(screen.getByRole("textbox", { name: /id del pedido/i })).toBeInTheDocument();
  });

  it("shows idle hint before any search", () => {
    renderWithProviders(<OrderAuditLogContainer />);

    expect(screen.getByText(/ingresá el id de un pedido/i)).toBeInTheDocument();
  });

  it("fetches and displays results when user submits a valid order ID", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrderAuditLogContainer />);

    await user.type(
      screen.getByRole("textbox", { name: /id del pedido/i }),
      "order-demo-completed",
    );
    await user.click(screen.getByRole("button", { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/order-demo-completed/i)).toBeInTheDocument();
    });

    expect(auditLogMockModule.auditLogService.findByOrderId).toHaveBeenCalledWith(
      "order-demo-completed",
    );
  });

  it("shows not-found message when service returns null", async () => {
    vi.spyOn(auditLogMockModule.auditLogService, "findByOrderId").mockResolvedValue(null);
    const user = userEvent.setup();
    renderWithProviders(<OrderAuditLogContainer />);

    await user.type(screen.getByRole("textbox", { name: /id del pedido/i }), "order-unknown");
    await user.click(screen.getByRole("button", { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/no se encontraron transiciones/i)).toBeInTheDocument();
    });
  });

  it("shows error message when service throws", async () => {
    vi.spyOn(auditLogMockModule.auditLogService, "findByOrderId").mockRejectedValue(
      new Error("Network failure"),
    );
    const user = userEvent.setup();
    renderWithProviders(<OrderAuditLogContainer />);

    await user.type(screen.getByRole("textbox", { name: /id del pedido/i }), "order-error-case");
    await user.click(screen.getByRole("button", { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
