import type { Order } from "@/shared/domain/order-state-machine";

export interface OrderActionsProps {
  readonly order: Order;
  readonly onAccept: () => void;
  readonly onReject: () => void;
  readonly onFinalize: () => void;
  readonly isAcceptPending: boolean;
  readonly isRejectPending: boolean;
  readonly isFinalizePending: boolean;
}
