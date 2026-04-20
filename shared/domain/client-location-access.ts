import { ORDER_STATUS, type OrderStatus } from "@/shared/constants/order";
import type { Coordinates } from "@/shared/schemas/coordinates";
import type { Result } from "./order-state-machine";

export type RequesterRole = "TIENDA" | "CLIENTE" | "SISTEMA";

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

// Statuses where the store is allowed to see client coordinates (post-accept)
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
  if (requesterRole !== "TIENDA" || STORE_ACCESSIBLE_STATUSES.has(order.status)) {
    return { ok: true, value: { lat: location.lat, lng: location.lng } };
  }

  return {
    ok: false,
    error: {
      kind: "FORBIDDEN",
      reason: `La ubicación del cliente no está disponible en estado ${order.status}`,
    },
  };
}
