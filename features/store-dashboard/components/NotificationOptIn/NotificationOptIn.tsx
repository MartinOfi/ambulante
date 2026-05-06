import { Row, Stack } from "@/shared/components/layout";
import { Text } from "@/shared/components/typography";
import { cn } from "@/shared/utils/cn";
import type { NotificationOptInProps } from "./NotificationOptIn.types";

const LABELS = Object.freeze({
  enable: "Activar avisos de pedidos",
  enabled: "Avisos de pedidos activados",
  denied: "Permiso denegado en el navegador",
  helperEnable: "Recibí avisos de pedidos nuevos al instante.",
  helperDenied: "Cambiá el permiso de notificaciones en los ajustes del navegador para activarlos.",
});

export function NotificationOptIn({
  isSubscribed,
  permission,
  isPending,
  isSupported,
  onToggle,
}: NotificationOptInProps) {
  if (!isSupported) return null;

  const isDenied = permission === "denied";
  const label = isSubscribed ? LABELS.enabled : isDenied ? LABELS.denied : LABELS.enable;
  const helper = isDenied ? LABELS.helperDenied : LABELS.helperEnable;
  const switchDisabled = isPending || isDenied;

  return (
    <Stack gap={2}>
      <Row className="items-center justify-between">
        <Stack gap={1}>
          <Text variant="body-sm" className="font-medium">
            {label}
          </Text>
          <Text variant="caption" className="text-muted-foreground">
            {helper}
          </Text>
        </Stack>
        <button
          type="button"
          role="switch"
          aria-checked={isSubscribed}
          aria-label={LABELS.enable}
          disabled={switchDisabled}
          onClick={onToggle}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            isSubscribed ? "bg-primary" : "bg-input",
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
              isSubscribed ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
      </Row>
    </Stack>
  );
}
