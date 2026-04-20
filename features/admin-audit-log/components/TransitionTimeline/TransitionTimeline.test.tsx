import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { TransitionTimeline } from "./TransitionTimeline";
import type { AuditLogEntry } from "@/features/admin-audit-log/types/audit-log.types";
import { ORDER_STATUS } from "@/shared/constants/order";
import { ORDER_ACTOR } from "@/shared/domain/order-state-machine";

const baseEntry: AuditLogEntry = {
  eventType: "SISTEMA_RECIBE",
  newStatus: ORDER_STATUS.RECIBIDO,
  actor: ORDER_ACTOR.SISTEMA,
  occurredAt: new Date("2024-01-15T10:00:00Z"),
};

describe("TransitionTimeline", () => {
  it("renders all transition entries", () => {
    const entries: readonly AuditLogEntry[] = [
      baseEntry,
      {
        eventType: "TIENDA_ACEPTA",
        newStatus: ORDER_STATUS.ACEPTADO,
        actor: ORDER_ACTOR.TIENDA,
        occurredAt: new Date("2024-01-15T10:05:00Z"),
      },
    ];

    render(<TransitionTimeline entries={entries} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
  });

  it("renders entries in ascending chronological order", () => {
    const entries: readonly AuditLogEntry[] = [
      {
        eventType: "TIENDA_ACEPTA",
        newStatus: ORDER_STATUS.ACEPTADO,
        actor: ORDER_ACTOR.TIENDA,
        occurredAt: new Date("2024-01-15T10:05:00Z"),
      },
      baseEntry,
    ];

    render(<TransitionTimeline entries={entries} />);

    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText(/recibido/i)).toBeInTheDocument();
    expect(within(items[1]).getByText(/aceptado/i)).toBeInTheDocument();
  });

  it("shows the actor label for each entry", () => {
    const entries: readonly AuditLogEntry[] = [baseEntry];

    render(<TransitionTimeline entries={entries} />);

    // "Sistema" appears as actor label; SISTEMA_RECIBE also appears as event type — use getAllByText
    const matches = screen.getAllByText(/sistema/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches.some((el) => el.textContent === "Sistema")).toBe(true);
  });

  it("renders empty state message when no entries", () => {
    render(<TransitionTimeline entries={[]} />);

    expect(screen.getByText(/sin transiciones/i)).toBeInTheDocument();
  });

  it("applies distinct styling to terminal FINALIZADO status", () => {
    const finishedEntry: AuditLogEntry = {
      eventType: "TIENDA_FINALIZA",
      newStatus: ORDER_STATUS.FINALIZADO,
      actor: ORDER_ACTOR.TIENDA,
      occurredAt: new Date("2024-01-15T11:00:00Z"),
    };

    const { container } = render(<TransitionTimeline entries={[finishedEntry]} />);

    const listItem = container.querySelector("li");
    expect(listItem?.className).toContain("border-[hsl(var(--success))]");
  });

  it("applies distinct styling to terminal RECHAZADO status", () => {
    const rejectedEntry: AuditLogEntry = {
      eventType: "TIENDA_RECHAZA",
      newStatus: ORDER_STATUS.RECHAZADO,
      actor: ORDER_ACTOR.TIENDA,
      occurredAt: new Date("2024-01-15T11:00:00Z"),
    };

    const { container } = render(<TransitionTimeline entries={[rejectedEntry]} />);

    const listItem = container.querySelector("li");
    expect(listItem?.className).toContain("border-[hsl(var(--destructive))]");
  });

  it("applies distinct styling to CANCELADO status", () => {
    const cancelledEntry: AuditLogEntry = {
      eventType: "CLIENTE_CANCELA",
      newStatus: ORDER_STATUS.CANCELADO,
      actor: ORDER_ACTOR.CLIENTE,
      occurredAt: new Date("2024-01-15T11:00:00Z"),
    };

    const { container } = render(<TransitionTimeline entries={[cancelledEntry]} />);

    const listItem = container.querySelector("li");
    expect(listItem?.className).toContain("border-[hsl(var(--destructive))]");
  });

  it("applies muted styling to EXPIRADO status", () => {
    const expiredEntry: AuditLogEntry = {
      eventType: "SISTEMA_EXPIRA",
      newStatus: ORDER_STATUS.EXPIRADO,
      actor: ORDER_ACTOR.SISTEMA,
      occurredAt: new Date("2024-01-15T11:00:00Z"),
    };

    const { container } = render(<TransitionTimeline entries={[expiredEntry]} />);

    const listItem = container.querySelector("li");
    expect(listItem?.className).toContain("border-[hsl(var(--muted))]");
  });

  it("shows each entry timestamp", () => {
    const entries: readonly AuditLogEntry[] = [baseEntry];

    render(<TransitionTimeline entries={entries} />);

    // Timestamp should be visible — exact format doesn't matter but date must appear
    expect(screen.getByText(/15.*ene|jan.*15/i)).toBeInTheDocument();
  });
});
