import { ORDER_STATUS, type OrderStatus } from "@/shared/constants/order";
import type { Coordinates } from "@/shared/schemas/coordinates";
import { ORDER_ACTOR, type Result } from "./order-state-machine";

export type RequesterRole = (typeof ORDER_ACTOR)[keyof typeof ORDER_ACTOR];

export type LocationAccessError = {
  readonly kind: "FORBIDDEN";
  readonly reason: string;
};

export type LocationAccessResult = Result<Coordinates, LocationAccessError>;

export interface GetClientLocationInput {
  readonly order: { readonly status: OrderStatus };
  readonly requesterRole: RequesterRole;
  readonly location: Coordinates;
}

const STORE_ACCESSIBLE_STATUSES = new Set<OrderStatus>([
  ORDER_STATUS.ACEPTADO,
  ORDER_STATUS.EN_CAMINO,
  ORDER_STATUS.FINALIZADO,
]);

export function getClientLocationForStore({
  order,
  requesterRole,
  location,
}: GetClientLocationInput): LocationAccessResult {
  const coords: Coordinates = { lat: location.lat, lng: location.lng };

  if (requesterRole === ORDER_ACTOR.CLIENTE || requesterRole === ORDER_ACTOR.SISTEMA) {
    return { ok: true, value: coords };
  }

  if (requesterRole === ORDER_ACTOR.TIENDA && STORE_ACCESSIBLE_STATUSES.has(order.status)) {
    return { ok: true, value: coords };
  }

  return {
    ok: false,
    error: {
      kind: "FORBIDDEN",
      reason: `La ubicación del cliente no está disponible en estado ${order.status}`,
    },
  };
}
