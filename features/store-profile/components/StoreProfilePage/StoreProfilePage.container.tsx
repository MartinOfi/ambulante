"use client";

import { useCurrentStoreIdQuery } from "@/features/store-profile/hooks/useCurrentStoreIdQuery";
import { useStoreProfileQuery } from "@/features/store-profile/hooks/useStoreProfileQuery";
import { useUpdateStoreProfileMutation } from "@/features/store-profile/hooks/useUpdateStoreProfileMutation";
import { StoreProfilePage } from "./StoreProfilePage";

export function StoreProfilePageContainer() {
  const { data: storeId, isLoading: isStoreLoading } = useCurrentStoreIdQuery();
  const resolvedStoreId = storeId ?? null;
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError,
  } = useStoreProfileQuery(resolvedStoreId);
  const { mutate: saveProfile, isPending } = useUpdateStoreProfileMutation(resolvedStoreId ?? "");

  const isLoading = isStoreLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando perfil…</p>
      </div>
    );
  }

  if (isError || profile === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">No se pudo cargar el perfil. Intentá de nuevo.</p>
      </div>
    );
  }

  return <StoreProfilePage profile={profile} onSave={saveProfile} isSaving={isPending} />;
}
