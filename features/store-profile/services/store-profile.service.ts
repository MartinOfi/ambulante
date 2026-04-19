import type {
  StoreProfile,
  UpdateStoreProfileInput,
} from "@/features/store-profile/schemas/store-profile.schemas";

export interface StoreProfileService {
  getProfile(storeId: string): Promise<StoreProfile>;
  updateProfile(storeId: string, input: UpdateStoreProfileInput): Promise<StoreProfile>;
}
