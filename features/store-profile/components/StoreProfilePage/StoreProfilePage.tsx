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
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Perfil de la tienda</h1>
      <StoreProfileForm defaultValues={profile} onSubmit={onSave} isPending={isSaving} />
    </div>
  );
}
