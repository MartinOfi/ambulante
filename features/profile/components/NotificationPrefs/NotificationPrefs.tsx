import { Stack, Row } from "@/shared/components/layout";
import { Text } from "@/shared/components/typography";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import {
  NOTIFICATION_PERMISSION,
  NOTIFICATION_PREF_KEYS,
  type NotificationPermission,
  type NotificationPrefKey,
} from "@/features/profile/constants";
import type { NotificationPrefs as NotificationPrefsType } from "@/features/profile/hooks/useNotificationPrefs";

interface NotificationPrefsProps {
  prefs: NotificationPrefsType;
  notificationPermission: NotificationPermission;
  onToggle: (key: NotificationPrefKey) => void;
  onRequestPermission: () => void;
}

const PREF_LABELS: Record<NotificationPrefKey, string> = {
  [NOTIFICATION_PREF_KEYS.ORDER_UPDATES]: "Actualizaciones de pedidos",
  [NOTIFICATION_PREF_KEYS.STORE_ARRIVAL]: "Llegada de tienda cercana",
  [NOTIFICATION_PREF_KEYS.MARKETING]: "Novedades y marketing",
};

const PREF_KEYS = [
  NOTIFICATION_PREF_KEYS.ORDER_UPDATES,
  NOTIFICATION_PREF_KEYS.STORE_ARRIVAL,
  NOTIFICATION_PREF_KEYS.MARKETING,
] as const;

interface PrefToggleProps {
  label: string;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}

function PrefToggle({ label, checked, disabled, onToggle }: PrefToggleProps) {
  return (
    <Row className="items-center justify-between py-1">
      <Text variant="body-sm">{label}</Text>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-primary" : "bg-input",
        )}
      >
        <span
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </Row>
  );
}

export function NotificationPrefs({
  prefs,
  notificationPermission,
  onToggle,
  onRequestPermission,
}: NotificationPrefsProps) {
  const isDenied = notificationPermission === NOTIFICATION_PERMISSION.DENIED;
  const isDefault = notificationPermission === NOTIFICATION_PERMISSION.DEFAULT;
  const isUnsupported = notificationPermission === NOTIFICATION_PERMISSION.UNSUPPORTED;
  const togglesDisabled = isDenied || isUnsupported;

  return (
    <Stack gap={3}>
      {isDenied && (
        <Text variant="body-sm" className="text-destructive">
          Notificaciones denegadas — habilitá los permisos desde la configuración del navegador.
        </Text>
      )}
      {isDefault && (
        <Row>
          <Button size="sm" variant="outline" onClick={onRequestPermission}>
            Activar notificaciones
          </Button>
        </Row>
      )}
      {PREF_KEYS.map((key) => (
        <PrefToggle
          key={key}
          label={PREF_LABELS[key]}
          checked={prefs[key]}
          disabled={togglesDisabled}
          onToggle={() => onToggle(key)}
        />
      ))}
    </Stack>
  );
}
