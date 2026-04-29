import { ORDER_STATUS, type OrderStatus } from "@/shared/constants/order";
import { logger } from "@/shared/utils/logger";
import type { AuditLogService } from "@/shared/services/audit-log";
import type { NewAuditLogEntry } from "@/shared/domain/audit-log";

// ── Actors ────────────────────────────────────────────────────────────────────

export const ORDER_ACTOR = {
  CLIENTE: "CLIENTE",
  TIENDA: "TIENDA",
  SISTEMA: "SISTEMA",
} as const;

export type OrderActor = (typeof ORDER_ACTOR)[keyof typeof ORDER_ACTOR];

// ── Events ────────────────────────────────────────────────────────────────────

export const ORDER_EVENT = {
  SISTEMA_RECIBE: "SISTEMA_RECIBE",
  TIENDA_ACEPTA: "TIENDA_ACEPTA",
  TIENDA_RECHAZA: "TIENDA_RECHAZA",
  TIENDA_FINALIZA: "TIENDA_FINALIZA",
  TIENDA_CANCELA: "TIENDA_CANCELA",
  CLIENTE_CONFIRMA_CAMINO: "CLIENTE_CONFIRMA_CAMINO",
  CLIENTE_CANCELA: "CLIENTE_CANCELA",
  SISTEMA_EXPIRA: "SISTEMA_EXPIRA",
  SISTEMA_AUTO_CIERRA: "SISTEMA_AUTO_CIERRA",
} as const;

export type OrderEventType = (typeof ORDER_EVENT)[keyof typeof ORDER_EVENT];

export interface OrderEvent {
  readonly type: OrderEventType;
  readonly occurredAt: Date;
}

// ── Order discriminated union ──────────────────────────────────────────────────

interface OrderBase {
  readonly id: string;
  readonly clientId: string;
  readonly storeId: string;
  readonly sentAt: Date;
}

export interface OrderEnviado extends OrderBase {
  readonly status: typeof ORDER_STATUS.ENVIADO;
}

export interface OrderRecibido extends OrderBase {
  readonly status: typeof ORDER_STATUS.RECIBIDO;
  readonly receivedAt: Date;
}

export interface OrderAceptado extends OrderBase {
  readonly status: typeof ORDER_STATUS.ACEPTADO;
  readonly receivedAt: Date;
  readonly acceptedAt: Date;
}

export interface OrderRechazado extends OrderBase {
  readonly status: typeof ORDER_STATUS.RECHAZADO;
  readonly receivedAt: Date;
  readonly rejectedAt: Date;
}

export interface OrderEnCamino extends OrderBase {
  readonly status: typeof ORDER_STATUS.EN_CAMINO;
  readonly receivedAt: Date;
  readonly acceptedAt: Date;
  readonly onTheWayAt: Date;
}

export interface OrderFinalizado extends OrderBase {
  readonly status: typeof ORDER_STATUS.FINALIZADO;
  readonly receivedAt: Date;
  readonly acceptedAt: Date;
  readonly onTheWayAt: Date;
  readonly finishedAt: Date;
}

export interface OrderCancelado extends OrderBase {
  readonly status: typeof ORDER_STATUS.CANCELADO;
  readonly cancelledAt: Date;
}

export interface OrderExpirado extends OrderBase {
  readonly status: typeof ORDER_STATUS.EXPIRADO;
  readonly expiredAt: Date;
}

export type Order =
  | OrderEnviado
  | OrderRecibido
  | OrderAceptado
  | OrderRechazado
  | OrderEnCamino
  | OrderFinalizado
  | OrderCancelado
  | OrderExpirado;

// ── Result ────────────────────────────────────────────────────────────────────

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

// ── Transition errors ─────────────────────────────────────────────────────────

export type TransitionError =
  | { readonly kind: "TERMINAL_STATE"; readonly status: OrderStatus }
  | {
      readonly kind: "INVALID_TRANSITION";
      readonly from: OrderStatus;
      readonly event: OrderEventType;
    }
  | {
      readonly kind: "UNAUTHORIZED_ACTOR";
      readonly actor: OrderActor;
      readonly event: OrderEventType;
      readonly required: readonly OrderActor[];
    };

export type TransitionResult = Result<Order, TransitionError>;

// Extends TransitionResult with optional audit-failure signal used by batch callers
// (e.g. cron handlers) that need to distinguish "transition ok + audit degraded".
export type TransitionWithAuditResult =
  | { ok: false; error: TransitionError }
  | { ok: true; value: Order; auditFailed?: true };

// ── Transition input ──────────────────────────────────────────────────────────

export interface TransitionInput {
  readonly order: Order;
  readonly event: OrderEvent;
  readonly actor: OrderActor;
}

// ── Transition map ────────────────────────────────────────────────────────────

interface TransitionDef {
  readonly requiredActors: readonly OrderActor[];
  readonly apply: (order: Order, occurredAt: Date) => Order;
}

type TransitionMap = Partial<Record<OrderStatus, Partial<Record<OrderEventType, TransitionDef>>>>;

const TERMINAL_STATUSES = new Set<OrderStatus>([
  ORDER_STATUS.RECHAZADO,
  ORDER_STATUS.FINALIZADO,
  ORDER_STATUS.EXPIRADO,
  ORDER_STATUS.CANCELADO,
]);

const TRANSITION_MAP: TransitionMap = {
  [ORDER_STATUS.ENVIADO]: {
    [ORDER_EVENT.SISTEMA_RECIBE]: {
      requiredActors: [ORDER_ACTOR.SISTEMA],
      apply: (order, occurredAt): OrderRecibido => ({
        id: order.id,
        clientId: order.clientId,
        storeId: order.storeId,
        sentAt: order.sentAt,
        status: ORDER_STATUS.RECIBIDO,
        receivedAt: occurredAt,
      }),
    },
    [ORDER_EVENT.CLIENTE_CANCELA]: {
      requiredActors: [ORDER_ACTOR.CLIENTE],
      apply: (order, occurredAt): OrderCancelado => ({
        id: order.id,
        clientId: order.clientId,
        storeId: order.storeId,
        sentAt: order.sentAt,
        status: ORDER_STATUS.CANCELADO,
        cancelledAt: occurredAt,
      }),
    },
    [ORDER_EVENT.SISTEMA_EXPIRA]: {
      requiredActors: [ORDER_ACTOR.SISTEMA],
      apply: (order, occurredAt): OrderExpirado => ({
        id: order.id,
        clientId: order.clientId,
        storeId: order.storeId,
        sentAt: order.sentAt,
        status: ORDER_STATUS.EXPIRADO,
        expiredAt: occurredAt,
      }),
    },
  },

  [ORDER_STATUS.RECIBIDO]: {
    [ORDER_EVENT.TIENDA_ACEPTA]: {
      requiredActors: [ORDER_ACTOR.TIENDA],
      apply: (order, occurredAt): OrderAceptado => {
        // Safe: TRANSITION_MAP key guarantees order.status === RECIBIDO here
        const recibido = order as OrderRecibido;
        return {
          id: recibido.id,
          clientId: recibido.clientId,
          storeId: recibido.storeId,
          sentAt: recibido.sentAt,
          status: ORDER_STATUS.ACEPTADO,
          receivedAt: recibido.receivedAt,
          acceptedAt: occurredAt,
        };
      },
    },
    [ORDER_EVENT.TIENDA_RECHAZA]: {
      requiredActors: [ORDER_ACTOR.TIENDA],
      apply: (order, occurredAt): OrderRechazado => {
        // Safe: TRANSITION_MAP key guarantees order.status === RECIBIDO here
        const recibido = order as OrderRecibido;
        return {
          id: recibido.id,
          clientId: recibido.clientId,
          storeId: recibido.storeId,
          sentAt: recibido.sentAt,
          status: ORDER_STATUS.RECHAZADO,
          receivedAt: recibido.receivedAt,
          rejectedAt: occurredAt,
        };
      },
    },
    [ORDER_EVENT.CLIENTE_CANCELA]: {
      requiredActors: [ORDER_ACTOR.CLIENTE],
      apply: (order, occurredAt): OrderCancelado => ({
        id: order.id,
        clientId: order.clientId,
        storeId: order.storeId,
        sentAt: order.sentAt,
        status: ORDER_STATUS.CANCELADO,
        cancelledAt: occurredAt,
      }),
    },
    [ORDER_EVENT.SISTEMA_EXPIRA]: {
      requiredActors: [ORDER_ACTOR.SISTEMA],
      apply: (order, occurredAt): OrderExpirado => ({
        id: order.id,
        clientId: order.clientId,
        storeId: order.storeId,
        sentAt: order.sentAt,
        status: ORDER_STATUS.EXPIRADO,
        expiredAt: occurredAt,
      }),
    },
  },

  [ORDER_STATUS.ACEPTADO]: {
    [ORDER_EVENT.CLIENTE_CONFIRMA_CAMINO]: {
      requiredActors: [ORDER_ACTOR.CLIENTE],
      apply: (order, occurredAt): OrderEnCamino => {
        // Safe: TRANSITION_MAP key guarantees order.status === ACEPTADO here
        const aceptado = order as OrderAceptado;
        return {
          id: aceptado.id,
          clientId: aceptado.clientId,
          storeId: aceptado.storeId,
          sentAt: aceptado.sentAt,
          status: ORDER_STATUS.EN_CAMINO,
          receivedAt: aceptado.receivedAt,
          acceptedAt: aceptado.acceptedAt,
          onTheWayAt: occurredAt,
        };
      },
    },
    [ORDER_EVENT.TIENDA_CANCELA]: {
      requiredActors: [ORDER_ACTOR.TIENDA],
      apply: (order, occurredAt): OrderCancelado => ({
        id: order.id,
        clientId: order.clientId,
        storeId: order.storeId,
        sentAt: order.sentAt,
        status: ORDER_STATUS.CANCELADO,
        cancelledAt: occurredAt,
      }),
    },
    // PRD §7.6: ACEPTADO orders not closed within 2h are auto-closed by the system.
    // No EN_CAMINO step occurred, so onTheWayAt is set to the close timestamp.
    [ORDER_EVENT.SISTEMA_AUTO_CIERRA]: {
      requiredActors: [ORDER_ACTOR.SISTEMA],
      apply: (order, occurredAt): OrderFinalizado => {
        // Safe: TRANSITION_MAP key guarantees order.status === ACEPTADO here
        const aceptado = order as OrderAceptado;
        return {
          id: aceptado.id,
          clientId: aceptado.clientId,
          storeId: aceptado.storeId,
          sentAt: aceptado.sentAt,
          status: ORDER_STATUS.FINALIZADO,
          receivedAt: aceptado.receivedAt,
          acceptedAt: aceptado.acceptedAt,
          onTheWayAt: occurredAt,
          finishedAt: occurredAt,
        };
      },
    },
  },

  [ORDER_STATUS.EN_CAMINO]: {
    [ORDER_EVENT.TIENDA_FINALIZA]: {
      requiredActors: [ORDER_ACTOR.TIENDA],
      apply: (order, occurredAt): OrderFinalizado => {
        // Safe: TRANSITION_MAP key guarantees order.status === EN_CAMINO here
        const enCamino = order as OrderEnCamino;
        return {
          id: enCamino.id,
          clientId: enCamino.clientId,
          storeId: enCamino.storeId,
          sentAt: enCamino.sentAt,
          status: ORDER_STATUS.FINALIZADO,
          receivedAt: enCamino.receivedAt,
          acceptedAt: enCamino.acceptedAt,
          onTheWayAt: enCamino.onTheWayAt,
          finishedAt: occurredAt,
        };
      },
    },
    [ORDER_EVENT.TIENDA_CANCELA]: {
      requiredActors: [ORDER_ACTOR.TIENDA],
      apply: (order, occurredAt): OrderCancelado => ({
        id: order.id,
        clientId: order.clientId,
        storeId: order.storeId,
        sentAt: order.sentAt,
        status: ORDER_STATUS.CANCELADO,
        cancelledAt: occurredAt,
      }),
    },
  },
};

// ── transition ────────────────────────────────────────────────────────────────

export function transition({ order, event, actor }: TransitionInput): TransitionResult {
  if (TERMINAL_STATUSES.has(order.status)) {
    return { ok: false, error: { kind: "TERMINAL_STATE", status: order.status } };
  }

  const statusMap = TRANSITION_MAP[order.status];
  const def = statusMap?.[event.type];

  if (!def) {
    return {
      ok: false,
      error: { kind: "INVALID_TRANSITION", from: order.status, event: event.type },
    };
  }

  if (!def.requiredActors.includes(actor)) {
    return {
      ok: false,
      error: { kind: "UNAUTHORIZED_ACTOR", actor, event: event.type, required: def.requiredActors },
    };
  }

  return { ok: true, value: def.apply(order, event.occurredAt) };
}

// ── transitionWithAudit ───────────────────────────────────────────────────────

export interface TransitionWithAuditInput extends TransitionInput {
  readonly auditLog: AuditLogService;
}

export async function transitionWithAudit({
  order,
  event,
  actor,
  auditLog,
}: TransitionWithAuditInput): Promise<TransitionWithAuditResult> {
  const result = transition({ order, event, actor });

  if (!result.ok) {
    return result;
  }

  const entry: NewAuditLogEntry = {
    orderId: order.id,
    actor,
    eventType: event.type,
    fromStatus: order.status,
    toStatus: result.value.status,
    occurredAt: event.occurredAt,
  };

  try {
    await auditLog.append(entry);
  } catch (error: unknown) {
    logger.error("transitionWithAudit: failed to append audit entry", { orderId: order.id, error });
    return { ok: true, value: result.value, auditFailed: true };
  }

  return { ok: true, value: result.value };
}
