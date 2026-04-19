import type {
  StoreProfile,
  UpdateStoreProfileInput,
} from "@/features/store-profile/schemas/store-profile.schemas";

export interface StoreProfileFormProps {
  readonly defaultValues: StoreProfile;
  readonly onSubmit: (data: UpdateStoreProfileInput) => void;
  readonly isPending: boolean;
}
