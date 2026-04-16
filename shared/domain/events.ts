// ── Event type constants ───────────────────────────────────────────────────────

export const ORDER_DOMAIN_EVENT = Object.freeze({
  ORDER_SENT: "ORDER_SENT",
  ORDER_RECEIVED: "ORDER_RECEIVED",
  ORDER_ACCEPTED: "ORDER_ACCEPTED",
  ORDER_REJECTED: "ORDER_REJECTED",
  ORDER_ON_THE_WAY: "ORDER_ON_THE_WAY",
  ORDER_FINISHED: "ORDER_FINISHED",
  ORDER_CANCELLED: "ORDER_CANCELLED",
  ORDER_EXPIRED: "ORDER_EXPIRED",
} as const);

export type OrderDomainEventType = (typeof ORDER_DOMAIN_EVENT)[keyof typeof ORDER_DOMAIN_EVENT];

// ── Base ───────────────────────────────────────────────────────────────────────

interface DomainEventBase<T extends OrderDomainEventType> {
  readonly type: T;
  readonly orderId: string;
  readonly clientId: string;
  readonly storeId: string;
  readonly occurredAt: Date;
}

// ── Specific events ────────────────────────────────────────────────────────────

export interface OrderSentDomainEvent extends DomainEventBase<
  typeof ORDER_DOMAIN_EVENT.ORDER_SENT
> {
  readonly sentAt: Date;
}

export interface OrderReceivedDomainEvent extends DomainEventBase<
  typeof ORDER_DOMAIN_EVENT.ORDER_RECEIVED
> {
  readonly sentAt: Date;
  readonly receivedAt: Date;
}

export interface OrderAcceptedDomainEvent extends DomainEventBase<
  typeof ORDER_DOMAIN_EVENT.ORDER_ACCEPTED
> {
  readonly sentAt: Date;
  readonly receivedAt: Date;
  readonly acceptedAt: Date;
}

export interface OrderRejectedDomainEvent extends DomainEventBase<
  typeof ORDER_DOMAIN_EVENT.ORDER_REJECTED
> {
  readonly sentAt: Date;
  readonly receivedAt: Date;
  readonly rejectedAt: Date;
}

export interface OrderOnTheWayDomainEvent extends DomainEventBase<
  typeof ORDER_DOMAIN_EVENT.ORDER_ON_THE_WAY
> {
  readonly sentAt: Date;
  readonly receivedAt: Date;
  readonly acceptedAt: Date;
  readonly onTheWayAt: Date;
}

export interface OrderFinishedDomainEvent extends DomainEventBase<
  typeof ORDER_DOMAIN_EVENT.ORDER_FINISHED
> {
  readonly sentAt: Date;
  readonly receivedAt: Date;
  readonly acceptedAt: Date;
  readonly onTheWayAt: Date;
  readonly finishedAt: Date;
}

export interface OrderCancelledDomainEvent extends DomainEventBase<
  typeof ORDER_DOMAIN_EVENT.ORDER_CANCELLED
> {
  readonly sentAt: Date;
  readonly cancelledAt: Date;
}

export interface OrderExpiredDomainEvent extends DomainEventBase<
  typeof ORDER_DOMAIN_EVENT.ORDER_EXPIRED
> {
  readonly sentAt: Date;
  readonly expiredAt: Date;
}

// ── Union ──────────────────────────────────────────────────────────────────────

export type OrderDomainEvent =
  | OrderSentDomainEvent
  | OrderReceivedDomainEvent
  | OrderAcceptedDomainEvent
  | OrderRejectedDomainEvent
  | OrderOnTheWayDomainEvent
  | OrderFinishedDomainEvent
  | OrderCancelledDomainEvent
  | OrderExpiredDomainEvent;

// ── Serialized form ────────────────────────────────────────────────────────────
// JSON-safe structure used by the F5 realtime hook. Dates → ISO strings.

export interface SerializedDomainEvent {
  readonly type: OrderDomainEventType;
  readonly orderId: string;
  readonly occurredAt: string;
  readonly payload: Readonly<Record<string, string>>;
}

// ── serializeEvent ─────────────────────────────────────────────────────────────

function toIso(date: Date): string {
  return date.toISOString();
}

function serializeDates(obj: Readonly<Record<string, unknown>>): Readonly<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Date) {
      result[key] = toIso(value);
    } else if (typeof value === "string") {
      result[key] = value;
    }
  }
  return result;
}

export function serializeEvent(event: OrderDomainEvent): SerializedDomainEvent {
  const { type, orderId, occurredAt, clientId, storeId, ...rest } = event;
  const payload = serializeDates({ ...rest, clientId, storeId } as Readonly<
    Record<string, unknown>
  >);
  return {
    type,
    orderId,
    occurredAt: toIso(occurredAt),
    payload,
  };
}
