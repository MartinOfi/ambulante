import { describe, it, expect } from "vitest";
import { ORDER_STATUS } from "@/shared/constants/order";
import { canCancelFromCustomer, getCancelRejectionMessage } from "./state-machine";

describe("canCancelFromCustomer", () => {
  it("permite cancelar desde ENVIADO", () => {
    expect(canCancelFromCustomer(ORDER_STATUS.ENVIADO)).toBe(true);
  });

  it("permite cancelar desde RECIBIDO", () => {
    expect(canCancelFromCustomer(ORDER_STATUS.RECIBIDO)).toBe(true);
  });

  it("rechaza ACEPTADO", () => {
    expect(canCancelFromCustomer(ORDER_STATUS.ACEPTADO)).toBe(false);
  });

  it("rechaza EN_CAMINO", () => {
    expect(canCancelFromCustomer(ORDER_STATUS.EN_CAMINO)).toBe(false);
  });

  it("rechaza FINALIZADO", () => {
    expect(canCancelFromCustomer(ORDER_STATUS.FINALIZADO)).toBe(false);
  });

  it("rechaza CANCELADO", () => {
    expect(canCancelFromCustomer(ORDER_STATUS.CANCELADO)).toBe(false);
  });

  it("rechaza RECHAZADO", () => {
    expect(canCancelFromCustomer(ORDER_STATUS.RECHAZADO)).toBe(false);
  });

  it("rechaza EXPIRADO", () => {
    expect(canCancelFromCustomer(ORDER_STATUS.EXPIRADO)).toBe(false);
  });
});

describe("getCancelRejectionMessage", () => {
  it("ACEPTADO → mensaje de 'aceptó el pedido'", () => {
    expect(getCancelRejectionMessage(ORDER_STATUS.ACEPTADO)).toMatch(/aceptó/i);
  });

  it("EN_CAMINO → mensaje de 'aceptó el pedido'", () => {
    expect(getCancelRejectionMessage(ORDER_STATUS.EN_CAMINO)).toMatch(/aceptó/i);
  });

  it("FINALIZADO → mensaje de 'ya está cerrado'", () => {
    expect(getCancelRejectionMessage(ORDER_STATUS.FINALIZADO)).toMatch(/cerrado/i);
  });

  it("CANCELADO → mensaje de 'ya está cerrado'", () => {
    expect(getCancelRejectionMessage(ORDER_STATUS.CANCELADO)).toMatch(/cerrado/i);
  });

  it("RECHAZADO → mensaje de 'ya está cerrado'", () => {
    expect(getCancelRejectionMessage(ORDER_STATUS.RECHAZADO)).toMatch(/cerrado/i);
  });

  it("EXPIRADO → mensaje de 'ya está cerrado'", () => {
    expect(getCancelRejectionMessage(ORDER_STATUS.EXPIRADO)).toMatch(/cerrado/i);
  });
});
