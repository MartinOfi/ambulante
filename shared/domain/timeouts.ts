import {
  ORDER_AUTOCLOSE_HOURS,
  ORDER_EXPIRATION_MINUTES,
  ORDER_STATUS,
  type OrderStatus,
} from "@/shared/constants/order";

// ── Timeout policy ─────────────────────────────────────────────────────────────

export interface TimeoutPolicy {
  readonly delayMs: number;
}

// PRD §7.6: EXPIRADO at 10min without store response (ENVIADO / RECIBIDO).
// PRD §7.6: auto-close at 2h for accepted-but-unclosed orders (ACEPTADO).
export const ORDER_TIMEOUT_POLICIES: Readonly<Partial<Record<OrderStatus, TimeoutPolicy>>> =
  Object.freeze({
    [ORDER_STATUS.ENVIADO]: { delayMs: ORDER_EXPIRATION_MINUTES * 60_000 },
    [ORDER_STATUS.RECIBIDO]: { delayMs: ORDER_EXPIRATION_MINUTES * 60_000 },
    [ORDER_STATUS.ACEPTADO]: { delayMs: ORDER_AUTOCLOSE_HOURS * 3_600_000 },
  });

// ── Scheduler interface ────────────────────────────────────────────────────────

export interface ScheduleInput {
  readonly orderId: string;
  readonly status: OrderStatus;
  readonly onFire: (orderId: string) => void;
}

export interface TimeoutScheduler {
  schedule(input: ScheduleInput): () => void;
}

// ── Mock implementation (setTimeout-based) ────────────────────────────────────

export function createSetTimeoutScheduler(): TimeoutScheduler {
  function schedule({ orderId, status, onFire }: ScheduleInput): () => void {
    const policy = ORDER_TIMEOUT_POLICIES[status];
    if (!policy) {
      return () => undefined;
    }
    const timer = setTimeout(() => onFire(orderId), policy.delayMs);
    return () => clearTimeout(timer);
  }

  return { schedule };
}
