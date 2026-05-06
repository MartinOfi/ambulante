import { createBrowserClient } from "@/shared/repositories/supabase/client";
import {
  MockStoreValidationService,
  storeValidationService as mockService,
} from "./store-validation.service.mock";
import { SupabaseStoreValidationService } from "./store-validation.supabase";
import type { StoreValidationService } from "./store-validation.service";

export { MockStoreValidationService };
export type { StoreValidationService };

const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const _client = isMock ? null : createBrowserClient();

export const storeValidationService: StoreValidationService = isMock
  ? mockService
  : new SupabaseStoreValidationService(_client!);
