import { createClient } from "@supabase/supabase-js";

import type {
  GetPublicUrlParams,
  RemoveParams,
  StorageResult,
  StorageService,
  UploadParams,
  UploadResult,
} from "./storage.types";

export function createStorageClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export const supabaseStorageService: StorageService = {
  async upload(_params: UploadParams): Promise<StorageResult<UploadResult>> {
    throw new Error("TODO — implementar en B8");
  },
  async remove(_params: RemoveParams): Promise<StorageResult<void>> {
    throw new Error("TODO — implementar en B8");
  },
  getPublicUrl(_params: GetPublicUrlParams): string {
    throw new Error("TODO — implementar en B8");
  },
};
