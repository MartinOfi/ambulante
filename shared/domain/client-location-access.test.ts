import { describe, expect, it } from "vitest";
import { getClientLocationForStore } from "./client-location-access";
import { ORDER_STATUS } from "@/shared/constants/order";
import { ORDER_ACTOR } from "./order-state-machine";
import type { Coordinates } from "@/shared/schemas/coordinates";

const clientCoords: Coordinates = { lat: -34.603722, lng: -58.381592 };

const orderWith = (status: (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]) =>
  ({ status }) as { status: (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS] };

describe("getClientLocationForStore", () => {
  describe("TIENDA role — statuses where access is FORBIDDEN", () => {
    // CANCELADO and EXPIRADO are reachable from post-accept states too (e.g. ACEPTADO → CANCELADO via TIENDA_CANCELA)
    const forbiddenStatuses = [
      ORDER_STATUS.ENVIADO,
      ORDER_STATUS.RECIBIDO,
      ORDER_STATUS.RECHAZADO,
      ORDER_STATUS.CANCELADO,
      ORDER_STATUS.EXPIRADO,
    ] as const;

    for (const status of forbiddenStatuses) {
      it(`returns FORBIDDEN when status is ${status}`, () => {
        const result = getClientLocationForStore({
          order: orderWith(status),
          requesterRole: ORDER_ACTOR.TIENDA,
          location: clientCoords,
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.kind).toBe("FORBIDDEN");
        }
      });
    }
  });

  describe("TIENDA role — statuses where access is GRANTED (post-accept)", () => {
    const accessibleStatuses = [
      ORDER_STATUS.ACEPTADO,
      ORDER_STATUS.EN_CAMINO,
      ORDER_STATUS.FINALIZADO,
    ] as const;

    for (const status of accessibleStatuses) {
      it(`returns coordinates when status is ${status}`, () => {
        const result = getClientLocationForStore({
          order: orderWith(status),
          requesterRole: ORDER_ACTOR.TIENDA,
          location: clientCoords,
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toEqual(clientCoords);
        }
      });
    }
  });

  describe("CLIENTE role — always gets own coords", () => {
    const allStatuses = Object.values(ORDER_STATUS);

    for (const status of allStatuses) {
      it(`CLIENTE always receives coords when status is ${status}`, () => {
        const result = getClientLocationForStore({
          order: orderWith(status),
          requesterRole: ORDER_ACTOR.CLIENTE,
          location: clientCoords,
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toEqual(clientCoords);
        }
      });
    }
  });

  describe("SISTEMA role — always gets coords", () => {
    const allStatuses = Object.values(ORDER_STATUS);

    for (const status of allStatuses) {
      it(`SISTEMA always receives coords when status is ${status}`, () => {
        const result = getClientLocationForStore({
          order: orderWith(status),
          requesterRole: ORDER_ACTOR.SISTEMA,
          location: clientCoords,
        });

        expect(result.ok).toBe(true);
      });
    }
  });

  describe("immutability", () => {
    it("returned coordinates are a new object, not the original reference", () => {
      const result = getClientLocationForStore({
        order: orderWith(ORDER_STATUS.ACEPTADO),
        requesterRole: ORDER_ACTOR.TIENDA,
        location: clientCoords,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).not.toBe(clientCoords);
        expect(result.value).toEqual(clientCoords);
      }
    });
  });
});
