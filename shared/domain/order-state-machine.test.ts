import { describe, expect, it } from "vitest";
import {
  ORDER_ACTOR,
  ORDER_EVENT,
  transition,
  type Order,
  type OrderEvent,
} from "@/shared/domain/order-state-machine";
import { ORDER_STATUS } from "@/shared/constants/order";

// ---- Fixtures ----

const BASE_DATE = new Date("2026-01-01T10:00:00Z");
const LATER_DATE = new Date("2026-01-01T10:05:00Z");
const EVEN_LATER_DATE = new Date("2026-01-01T10:10:00Z");

const baseOrderEnviado: Order = {
  id: "order-1",
  clientId: "client-1",
  storeId: "store-1",
  status: ORDER_STATUS.ENVIADO,
  sentAt: BASE_DATE,
};

function makeEvent(type: OrderEvent["type"], occurredAt = LATER_DATE): OrderEvent {
  return { type, occurredAt };
}

// ---- Helper to assert Result ----
function assertOk(result: ReturnType<typeof transition>) {
  if (!result.ok) throw new Error(`Expected ok but got error: ${JSON.stringify(result.error)}`);
  return result.value;
}

function assertErr(result: ReturnType<typeof transition>) {
  if (result.ok) throw new Error(`Expected error but got ok: ${JSON.stringify(result.value)}`);
  return result.error;
}

// ====================================================================
// HAPPY PATHS — todas las transiciones válidas (PRD §6.1)
// ====================================================================

describe("transition — happy paths", () => {
  it("ENVIADO → RECIBIDO via SISTEMA_RECIBE", () => {
    const result = transition({
      order: baseOrderEnviado,
      event: makeEvent(ORDER_EVENT.SISTEMA_RECIBE),
      actor: ORDER_ACTOR.SISTEMA,
    });
    const next = assertOk(result);
    expect(next.status).toBe(ORDER_STATUS.RECIBIDO);
    expect((next as { receivedAt: Date }).receivedAt).toEqual(LATER_DATE);
  });

  it("ENVIADO → CANCELADO via CLIENTE_CANCELA", () => {
    const next = assertOk(
      transition({
        order: baseOrderEnviado,
        event: makeEvent(ORDER_EVENT.CLIENTE_CANCELA),
        actor: ORDER_ACTOR.CLIENTE,
      }),
    );
    expect(next.status).toBe(ORDER_STATUS.CANCELADO);
    expect((next as { cancelledAt: Date }).cancelledAt).toEqual(LATER_DATE);
  });

  it("ENVIADO → EXPIRADO via SISTEMA_EXPIRA", () => {
    const next = assertOk(
      transition({
        order: baseOrderEnviado,
        event: makeEvent(ORDER_EVENT.SISTEMA_EXPIRA),
        actor: ORDER_ACTOR.SISTEMA,
      }),
    );
    expect(next.status).toBe(ORDER_STATUS.EXPIRADO);
    expect((next as { expiredAt: Date }).expiredAt).toEqual(LATER_DATE);
  });

  it("RECIBIDO → ACEPTADO via TIENDA_ACEPTA", () => {
    const orderRecibido: Order = {
      ...baseOrderEnviado,
      status: ORDER_STATUS.RECIBIDO,
      receivedAt: LATER_DATE,
    };
    const next = assertOk(
      transition({
        order: orderRecibido,
        event: makeEvent(ORDER_EVENT.TIENDA_ACEPTA, EVEN_LATER_DATE),
        actor: ORDER_ACTOR.TIENDA,
      }),
    );
    expect(next.status).toBe(ORDER_STATUS.ACEPTADO);
    expect((next as { acceptedAt: Date }).acceptedAt).toEqual(EVEN_LATER_DATE);
  });

  it("RECIBIDO → RECHAZADO via TIENDA_RECHAZA", () => {
    const orderRecibido: Order = {
      ...baseOrderEnviado,
      status: ORDER_STATUS.RECIBIDO,
      receivedAt: LATER_DATE,
    };
    const next = assertOk(
      transition({
        order: orderRecibido,
        event: makeEvent(ORDER_EVENT.TIENDA_RECHAZA, EVEN_LATER_DATE),
        actor: ORDER_ACTOR.TIENDA,
      }),
    );
    expect(next.status).toBe(ORDER_STATUS.RECHAZADO);
    expect((next as { rejectedAt: Date }).rejectedAt).toEqual(EVEN_LATER_DATE);
  });

  it("RECIBIDO → CANCELADO via CLIENTE_CANCELA (pre-ACEPTADO)", () => {
    const orderRecibido: Order = {
      ...baseOrderEnviado,
      status: ORDER_STATUS.RECIBIDO,
      receivedAt: LATER_DATE,
    };
    const next = assertOk(
      transition({
        order: orderRecibido,
        event: makeEvent(ORDER_EVENT.CLIENTE_CANCELA, EVEN_LATER_DATE),
        actor: ORDER_ACTOR.CLIENTE,
      }),
    );
    expect(next.status).toBe(ORDER_STATUS.CANCELADO);
  });

  it("RECIBIDO → EXPIRADO via SISTEMA_EXPIRA", () => {
    const orderRecibido: Order = {
      ...baseOrderEnviado,
      status: ORDER_STATUS.RECIBIDO,
      receivedAt: LATER_DATE,
    };
    const next = assertOk(
      transition({
        order: orderRecibido,
        event: makeEvent(ORDER_EVENT.SISTEMA_EXPIRA, EVEN_LATER_DATE),
        actor: ORDER_ACTOR.SISTEMA,
      }),
    );
    expect(next.status).toBe(ORDER_STATUS.EXPIRADO);
  });

  it("ACEPTADO → EN_CAMINO via CLIENTE_CONFIRMA_CAMINO", () => {
    const orderAceptado: Order = {
      ...baseOrderEnviado,
      status: ORDER_STATUS.ACEPTADO,
      receivedAt: LATER_DATE,
      acceptedAt: LATER_DATE,
    };
    const next = assertOk(
      transition({
        order: orderAceptado,
        event: makeEvent(ORDER_EVENT.CLIENTE_CONFIRMA_CAMINO, EVEN_LATER_DATE),
        actor: ORDER_ACTOR.CLIENTE,
      }),
    );
    expect(next.status).toBe(ORDER_STATUS.EN_CAMINO);
    expect((next as { onTheWayAt: Date }).onTheWayAt).toEqual(EVEN_LATER_DATE);
  });

  it("ACEPTADO → CANCELADO via TIENDA_CANCELA (post-ACEPTADO, solo tienda)", () => {
    const orderAceptado: Order = {
      ...baseOrderEnviado,
      status: ORDER_STATUS.ACEPTADO,
      receivedAt: LATER_DATE,
      acceptedAt: LATER_DATE,
    };
    const next = assertOk(
      transition({
        order: orderAceptado,
        event: makeEvent(ORDER_EVENT.TIENDA_CANCELA, EVEN_LATER_DATE),
        actor: ORDER_ACTOR.TIENDA,
      }),
    );
    expect(next.status).toBe(ORDER_STATUS.CANCELADO);
  });

  it("EN_CAMINO → FINALIZADO via TIENDA_FINALIZA", () => {
    const orderEnCamino: Order = {
      ...baseOrderEnviado,
      status: ORDER_STATUS.EN_CAMINO,
      receivedAt: LATER_DATE,
      acceptedAt: LATER_DATE,
      onTheWayAt: LATER_DATE,
    };
    const next = assertOk(
      transition({
        order: orderEnCamino,
        event: makeEvent(ORDER_EVENT.TIENDA_FINALIZA, EVEN_LATER_DATE),
        actor: ORDER_ACTOR.TIENDA,
      }),
    );
    expect(next.status).toBe(ORDER_STATUS.FINALIZADO);
    expect((next as { finishedAt: Date }).finishedAt).toEqual(EVEN_LATER_DATE);
  });

  it("EN_CAMINO → CANCELADO via TIENDA_CANCELA", () => {
    const orderEnCamino: Order = {
      ...baseOrderEnviado,
      status: ORDER_STATUS.EN_CAMINO,
      receivedAt: LATER_DATE,
      acceptedAt: LATER_DATE,
      onTheWayAt: LATER_DATE,
    };
    const next = assertOk(
      transition({
        order: orderEnCamino,
        event: makeEvent(ORDER_EVENT.TIENDA_CANCELA, EVEN_LATER_DATE),
        actor: ORDER_ACTOR.TIENDA,
      }),
    );
    expect(next.status).toBe(ORDER_STATUS.CANCELADO);
  });
});

// ====================================================================
// TERMINAL STATES — no se puede transicionar desde estados terminales
// ====================================================================

describe("transition — terminal states are immutable", () => {
  const terminalStatuses = [
    ORDER_STATUS.RECHAZADO,
    ORDER_STATUS.FINALIZADO,
    ORDER_STATUS.EXPIRADO,
    ORDER_STATUS.CANCELADO,
  ] as const;

  for (const status of terminalStatuses) {
    it(`blocks any transition from ${status}`, () => {
      const order = { ...baseOrderEnviado, status } as Order;
      const error = assertErr(
        transition({
          order,
          event: makeEvent(ORDER_EVENT.SISTEMA_RECIBE),
          actor: ORDER_ACTOR.SISTEMA,
        }),
      );
      expect(error.kind).toBe("TERMINAL_STATE");
      if (error.kind === "TERMINAL_STATE") {
        expect(error.status).toBe(status);
      }
    });
  }
});

// ====================================================================
// INVALID TRANSITIONS — evento que no aplica al estado actual
// ====================================================================

describe("transition — invalid transitions", () => {
  it("ENVIADO + TIENDA_ACEPTA → INVALID_TRANSITION", () => {
    const error = assertErr(
      transition({
        order: baseOrderEnviado,
        event: makeEvent(ORDER_EVENT.TIENDA_ACEPTA),
        actor: ORDER_ACTOR.TIENDA,
      }),
    );
    expect(error.kind).toBe("INVALID_TRANSITION");
    if (error.kind === "INVALID_TRANSITION") {
      expect(error.from).toBe(ORDER_STATUS.ENVIADO);
      expect(error.event).toBe(ORDER_EVENT.TIENDA_ACEPTA);
    }
  });

  it("ACEPTADO + SISTEMA_EXPIRA → INVALID_TRANSITION (expiración solo en ENVIADO/RECIBIDO)", () => {
    const orderAceptado: Order = {
      ...baseOrderEnviado,
      status: ORDER_STATUS.ACEPTADO,
      receivedAt: LATER_DATE,
      acceptedAt: LATER_DATE,
    };
    const error = assertErr(
      transition({
        order: orderAceptado,
        event: makeEvent(ORDER_EVENT.SISTEMA_EXPIRA),
        actor: ORDER_ACTOR.SISTEMA,
      }),
    );
    expect(error.kind).toBe("INVALID_TRANSITION");
  });

  it("RECIBIDO + TIENDA_FINALIZA → INVALID_TRANSITION", () => {
    const orderRecibido: Order = {
      ...baseOrderEnviado,
      status: ORDER_STATUS.RECIBIDO,
      receivedAt: LATER_DATE,
    };
    const error = assertErr(
      transition({
        order: orderRecibido,
        event: makeEvent(ORDER_EVENT.TIENDA_FINALIZA),
        actor: ORDER_ACTOR.TIENDA,
      }),
    );
    expect(error.kind).toBe("INVALID_TRANSITION");
  });
});

// ====================================================================
// UNAUTHORIZED ACTORS — actor incorrecto para transición válida
// ====================================================================

describe("transition — unauthorized actors", () => {
  it("SISTEMA_RECIBE por CLIENTE → UNAUTHORIZED_ACTOR", () => {
    const error = assertErr(
      transition({
        order: baseOrderEnviado,
        event: makeEvent(ORDER_EVENT.SISTEMA_RECIBE),
        actor: ORDER_ACTOR.CLIENTE,
      }),
    );
    expect(error.kind).toBe("UNAUTHORIZED_ACTOR");
    if (error.kind === "UNAUTHORIZED_ACTOR") {
      expect(error.actor).toBe(ORDER_ACTOR.CLIENTE);
      expect(error.event).toBe(ORDER_EVENT.SISTEMA_RECIBE);
      expect(error.required).toContain(ORDER_ACTOR.SISTEMA);
    }
  });

  it("TIENDA_ACEPTA por CLIENTE → UNAUTHORIZED_ACTOR", () => {
    const orderRecibido: Order = {
      ...baseOrderEnviado,
      status: ORDER_STATUS.RECIBIDO,
      receivedAt: LATER_DATE,
    };
    const error = assertErr(
      transition({
        order: orderRecibido,
        event: makeEvent(ORDER_EVENT.TIENDA_ACEPTA),
        actor: ORDER_ACTOR.CLIENTE,
      }),
    );
    expect(error.kind).toBe("UNAUTHORIZED_ACTOR");
  });

  it("CLIENTE_CANCELA por TIENDA en ENVIADO → UNAUTHORIZED_ACTOR", () => {
    const error = assertErr(
      transition({
        order: baseOrderEnviado,
        event: makeEvent(ORDER_EVENT.CLIENTE_CANCELA),
        actor: ORDER_ACTOR.TIENDA,
      }),
    );
    expect(error.kind).toBe("UNAUTHORIZED_ACTOR");
  });

  it("CLIENTE_CONFIRMA_CAMINO por TIENDA → UNAUTHORIZED_ACTOR", () => {
    const orderAceptado: Order = {
      ...baseOrderEnviado,
      status: ORDER_STATUS.ACEPTADO,
      receivedAt: LATER_DATE,
      acceptedAt: LATER_DATE,
    };
    const error = assertErr(
      transition({
        order: orderAceptado,
        event: makeEvent(ORDER_EVENT.CLIENTE_CONFIRMA_CAMINO),
        actor: ORDER_ACTOR.TIENDA,
      }),
    );
    expect(error.kind).toBe("UNAUTHORIZED_ACTOR");
  });
});

// ====================================================================
// IMMUTABILITY — el objeto original no se muta
// ====================================================================

describe("transition — immutability", () => {
  it("does not mutate the input order", () => {
    const original = { ...baseOrderEnviado };
    transition({
      order: baseOrderEnviado,
      event: makeEvent(ORDER_EVENT.SISTEMA_RECIBE),
      actor: ORDER_ACTOR.SISTEMA,
    });
    expect(baseOrderEnviado).toEqual(original);
  });
});

// ====================================================================
// TIMESTAMP PROPAGATION — los timestamps se acumulan correctamente
// ====================================================================

describe("transition — timestamp propagation through full chain", () => {
  it("accumulates all timestamps across a full happy path", () => {
    const t1 = new Date("2026-01-01T10:00:00Z");
    const t2 = new Date("2026-01-01T10:01:00Z");
    const t3 = new Date("2026-01-01T10:02:00Z");
    const t4 = new Date("2026-01-01T10:03:00Z");
    const t5 = new Date("2026-01-01T10:04:00Z");

    const enviado: Order = {
      id: "o1",
      clientId: "c1",
      storeId: "s1",
      status: ORDER_STATUS.ENVIADO,
      sentAt: t1,
    };

    const recibido = assertOk(
      transition({
        order: enviado,
        event: { type: ORDER_EVENT.SISTEMA_RECIBE, occurredAt: t2 },
        actor: ORDER_ACTOR.SISTEMA,
      }),
    );
    const aceptado = assertOk(
      transition({
        order: recibido,
        event: { type: ORDER_EVENT.TIENDA_ACEPTA, occurredAt: t3 },
        actor: ORDER_ACTOR.TIENDA,
      }),
    );
    const enCamino = assertOk(
      transition({
        order: aceptado,
        event: { type: ORDER_EVENT.CLIENTE_CONFIRMA_CAMINO, occurredAt: t4 },
        actor: ORDER_ACTOR.CLIENTE,
      }),
    );
    const finalizado = assertOk(
      transition({
        order: enCamino,
        event: { type: ORDER_EVENT.TIENDA_FINALIZA, occurredAt: t5 },
        actor: ORDER_ACTOR.TIENDA,
      }),
    );

    expect(finalizado.status).toBe(ORDER_STATUS.FINALIZADO);
    expect(finalizado.sentAt).toEqual(t1);
    expect((finalizado as { receivedAt: Date }).receivedAt).toEqual(t2);
    expect((finalizado as { acceptedAt: Date }).acceptedAt).toEqual(t3);
    expect((finalizado as { onTheWayAt: Date }).onTheWayAt).toEqual(t4);
    expect((finalizado as { finishedAt: Date }).finishedAt).toEqual(t5);
  });
});
