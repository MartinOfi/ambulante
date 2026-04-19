import { Stack } from "@/shared/components/layout";
import { Text } from "@/shared/components/typography";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { LocationPermission } from "@/features/profile/components/LocationPermission/LocationPermission";
import { NotificationPrefs } from "@/features/profile/components/NotificationPrefs/NotificationPrefs";
import type { ProfilePageProps } from "./ProfilePage.types";

export function ProfilePage({
  displayName,
  email,
  locationStatus,
  notificationPermission,
  prefs,
  onRequestLocation,
  onTogglePref,
  onRequestNotificationPermission,
  onSignOut,
}: ProfilePageProps) {
  return (
    <Stack gap={6} className="mx-auto max-w-lg p-4">
      <Stack gap={1}>
        <Text variant="display-lg">{displayName ?? "Invitado"}</Text>
        <Text variant="body-sm" className="text-muted-foreground">
          {email}
        </Text>
      </Stack>

      <Card className="p-4">
        <Stack gap={3}>
          <Text variant="heading-sm">Ubicación</Text>
          <LocationPermission status={locationStatus} onRequest={onRequestLocation} />
        </Stack>
      </Card>

      <Card className="p-4">
        <Stack gap={3}>
          <Text variant="heading-sm">Notificaciones</Text>
          <NotificationPrefs
            prefs={prefs}
            notificationPermission={notificationPermission}
            onToggle={onTogglePref}
            onRequestPermission={onRequestNotificationPermission}
          />
        </Stack>
      </Card>

      <Button variant="outline" onClick={onSignOut} className="w-full">
        Cerrar sesión
      </Button>
    </Stack>
  );
}
