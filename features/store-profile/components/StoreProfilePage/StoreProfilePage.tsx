"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import type {
  StoreProfile,
  UpdateStoreProfileInput,
} from "@/features/store-profile/schemas/store-profile.schemas";
import { StoreProfileForm } from "@/features/store-profile/components/StoreProfileForm";

interface StoreProfilePageProps {
  readonly profile: StoreProfile;
  readonly onSave: (data: UpdateStoreProfileInput) => void;
  readonly isSaving: boolean;
}

export function StoreProfilePage({ profile, onSave, isSaving }: StoreProfilePageProps) {
  const t = useTranslations("StoreProfile.Page");
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (data: UpdateStoreProfileInput) => {
    onSave(data);
    toast.success("Cambios guardados");
    setIsEditing(false);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-lg font-medium" data-testid="store-name">
            {profile.businessName}
          </p>
        </div>
        {!isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Editar perfil
          </Button>
        )}
      </div>

      {isEditing && (
        <StoreProfileForm defaultValues={profile} onSubmit={handleSave} isPending={isSaving} />
      )}
    </div>
  );
}
