import { storeProfileService as mockService, MOCK_STORE_ID } from "./store-profile.mock";
import { supabaseStoreProfileService } from "./store-profile.supabase";

export type { StoreProfileService } from "./store-profile.service";
export { MOCK_STORE_ID };

const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const storeProfileService = isMock ? mockService : supabaseStoreProfileService;
