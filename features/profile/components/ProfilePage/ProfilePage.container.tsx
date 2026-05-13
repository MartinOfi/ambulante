"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/shared/hooks/useSession";
import { useLocationPermission } from "@/features/profile/hooks/useLocationPermission";
import { useNotificationPrefs } from "@/features/profile/hooks/useNotificationPrefs";
import { AvatarUploadContainer } from "@/features/profile/components/AvatarUpload";
import { DisplayNameFieldContainer } from "@/features/profile/components/DisplayNameField";
import { PushOptInToggleContainer } from "@/features/profile/components/PushOptInToggle";
import { ROUTES } from "@/shared/constants/routes";
import { ProfilePage } from "./ProfilePage";

export function ProfilePageContainer() {
  const router = useRouter();
  const sessionResult = useSession();
  const { status: locationStatus, requestPermission } = useLocationPermission();
  const { prefs, notificationPermission, togglePref, requestNotificationPermission } =
    useNotificationPrefs();

  const user = sessionResult.status === "authenticated" ? sessionResult.session.user : null;
  const isAuthenticated = user !== null;

  const handleSignOut = useCallback(async () => {
    await sessionResult.signOut();
    router.push(ROUTES.auth.login);
  }, [sessionResult, router]);

  return (
    <ProfilePage
      displayName={user?.displayName}
      email={user?.email ?? ""}
      locationStatus={locationStatus}
      notificationPermission={notificationPermission}
      prefs={prefs}
      onRequestLocation={requestPermission}
      onTogglePref={togglePref}
      onRequestNotificationPermission={requestNotificationPermission}
      onSignOut={handleSignOut}
      avatarSlot={
        isAuthenticated ? <AvatarUploadContainer currentUrl={user.avatarUrl} /> : undefined
      }
      displayNameEditorSlot={
        isAuthenticated ? (
          <DisplayNameFieldContainer initialValue={user.displayName ?? ""} />
        ) : undefined
      }
      pushOptInSlot={isAuthenticated ? <PushOptInToggleContainer /> : undefined}
    />
  );
}
