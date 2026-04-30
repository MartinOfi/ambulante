"use client";

import { useTranslations } from "next-intl";
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
  avatarSlot,
  displayNameEditorSlot,
  pushOptInSlot,
}: ProfilePageProps) {
  const t = useTranslations("Profile.Page");

  return (
    <Stack gap={6} className="mx-auto max-w-lg p-4">
      <Stack gap={1}>
        <Text variant="display-lg">{displayName ?? t("guest")}</Text>
        <Text variant="body-sm" className="text-muted-foreground">
          {email}
        </Text>
      </Stack>

      {avatarSlot !== undefined || displayNameEditorSlot !== undefined ? (
        <Card className="p-4">
          <Stack gap={4}>
            <Text variant="heading-sm">Perfil</Text>
            {avatarSlot}
            {displayNameEditorSlot}
          </Stack>
        </Card>
      ) : null}

      <Card className="p-4">
        <Stack gap={3}>
          <Text variant="heading-sm">{t("locationSection")}</Text>
          <LocationPermission status={locationStatus} onRequest={onRequestLocation} />
        </Stack>
      </Card>

      <Card className="p-4">
        <Stack gap={4}>
          <Text variant="heading-sm">{t("notificationsSection")}</Text>
          {pushOptInSlot}
          <NotificationPrefs
            prefs={prefs}
            notificationPermission={notificationPermission}
            onToggle={onTogglePref}
            onRequestPermission={onRequestNotificationPermission}
          />
        </Stack>
      </Card>

      <Button variant="outline" onClick={onSignOut} className="w-full">
        {t("signOut")}
      </Button>
    </Stack>
  );
}
