import { ORDER_STATUS } from "@/shared/constants/order";
import type { OrderTrackingProps } from "./OrderTracking.types";

const MAIN_FLOW_STEPS = [
  ORDER_STATUS.ENVIADO,
  ORDER_STATUS.RECIBIDO,
  ORDER_STATUS.ACEPTADO,
  ORDER_STATUS.EN_CAMINO,
  ORDER_STATUS.FINALIZADO,
] as const;

const STEP_INDEX = Object.fromEntries(MAIN_FLOW_STEPS.map((step, i) => [step, i])) as Record<
  (typeof MAIN_FLOW_STEPS)[number],
  number
>;

const TERMINAL_LABELS: Partial<Record<string, string>> = {
  [ORDER_STATUS.CANCELADO]: "Pedido cancelado",
  [ORDER_STATUS.RECHAZADO]: "Pedido rechazado",
  [ORDER_STATUS.EXPIRADO]: "Pedido expirado",
};

export function OrderTracking({
  order,
  onConfirmOnTheWay,
  onCancel,
  isCancelling,
  isConfirmingOnTheWay,
}: OrderTrackingProps) {
  const { status } = order;
  const terminalLabel = TERMINAL_LABELS[status];

  if (terminalLabel !== undefined) {
    return (
      <div>
        <p>{terminalLabel}</p>
      </div>
    );
  }

  const currentIndex = STEP_INDEX[status as (typeof MAIN_FLOW_STEPS)[number]] ?? -1;

  return (
    <div>
      <ol>
        {MAIN_FLOW_STEPS.map((step) => {
          const stepIndex = STEP_INDEX[step];
          const isCurrent = step === status;
          const isCompleted = stepIndex < currentIndex;

          return (
            <li
              key={step}
              data-testid={`step-${step}`}
              data-current={String(isCurrent)}
              data-completed={String(isCompleted)}
            >
              {step}
            </li>
          );
        })}
      </ol>

      {(status === ORDER_STATUS.ENVIADO || status === ORDER_STATUS.RECIBIDO) && (
        <button onClick={onCancel} disabled={isCancelling}>
          Cancelar pedido
        </button>
      )}

      {status === ORDER_STATUS.ACEPTADO && (
        <button onClick={onConfirmOnTheWay} disabled={isConfirmingOnTheWay}>
          Confirmar en camino
        </button>
      )}
    </div>
  );
}
