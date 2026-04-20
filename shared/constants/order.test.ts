import { describe, it, expect } from "vitest";
import {
  ORDER_STATUS,
  ORDER_EXPIRATION_MINUTES,
  ORDER_AUTOCLOSE_HOURS,
  TERMINAL_ORDER_STATUSES,
  type OrderStatus,
} from "./order";

describe("ORDER_STATUS", () => {
  it("contains all states defined in the PRD §6.1 state machine", () => {
    const expected = [
      "ENVIADO",
      "RECIBIDO",
      "ACEPTADO",
      "RECHAZADO",
      "EN_CAMINO",
      "FINALIZADO",
      "CANCELADO",
      "EXPIRADO",
    ] as const;

    for (const state of expected) {
      expect(ORDER_STATUS).toHaveProperty(state);
      expect(ORDER_STATUS[state]).toBe(state);
    }
  });

  it("has no extra states beyond the PRD", () => {
    const keys = Object.keys(ORDER_STATUS);
    expect(keys).toHaveLength(8);
  });

  it("is a frozen object (immutable)", () => {
    expect(Object.isFrozen(ORDER_STATUS)).toBe(true);
  });
});

describe("TERMINAL_ORDER_STATUSES", () => {
  it("contains the four terminal states (CANCELADO, RECHAZADO, FINALIZADO, EXPIRADO)", () => {
    expect(TERMINAL_ORDER_STATUSES).toContain(ORDER_STATUS.CANCELADO);
    expect(TERMINAL_ORDER_STATUSES).toContain(ORDER_STATUS.RECHAZADO);
    expect(TERMINAL_ORDER_STATUSES).toContain(ORDER_STATUS.FINALIZADO);
    expect(TERMINAL_ORDER_STATUSES).toContain(ORDER_STATUS.EXPIRADO);
  });

  it("does not include non-terminal states", () => {
    const nonTerminal: OrderStatus[] = [
      ORDER_STATUS.ENVIADO,
      ORDER_STATUS.RECIBIDO,
      ORDER_STATUS.ACEPTADO,
      ORDER_STATUS.EN_CAMINO,
    ];
    for (const state of nonTerminal) {
      expect(TERMINAL_ORDER_STATUSES).not.toContain(state);
    }
  });

  it("has exactly 4 terminal states", () => {
    expect(TERMINAL_ORDER_STATUSES).toHaveLength(4);
  });
});

describe("ORDER_EXPIRATION_MINUTES", () => {
  it("is 10 minutes as specified in PRD §9.2", () => {
    expect(ORDER_EXPIRATION_MINUTES).toBe(10);
  });

  it("is a positive number", () => {
    expect(ORDER_EXPIRATION_MINUTES).toBeGreaterThan(0);
  });
});

describe("ORDER_AUTOCLOSE_HOURS", () => {
  it("is 2 hours as specified in PRD §9.2", () => {
    expect(ORDER_AUTOCLOSE_HOURS).toBe(2);
  });

  it("is a positive number", () => {
    expect(ORDER_AUTOCLOSE_HOURS).toBeGreaterThan(0);
  });
});
