"use client";

import { MOCK_STORE_ID } from "@/features/store-profile/services/store-profile.mock";
import { useStoreProfileQuery } from "@/features/store-profile/hooks/useStoreProfileQuery";
import { useUpdateStoreProfileMutation } from "@/features/store-profile/hooks/useUpdateStoreProfileMutation";
import { StoreProfilePage } from "./StoreProfilePage";

export function StoreProfilePageContainer() {
  const { data: profile, isLoading, isError } = useStoreProfileQuery(MOCK_STORE_ID);
  const { mutate: saveProfile, isPending } = useUpdateStoreProfileMutation(MOCK_STORE_ID);

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
