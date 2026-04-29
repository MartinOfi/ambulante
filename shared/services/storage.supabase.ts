import { createBrowserClient } from "@supabase/ssr";

import {
  STORAGE_ALLOWED_MIME_TYPES,
  STORAGE_BUCKETS,
  STORAGE_SIZE_LIMITS,
} from "@/shared/constants/storage";

import type {
  GetPublicUrlParams,
  GetSignedUrlParams,
  RemoveParams,
  StorageResult,
  StorageService,
  UploadParams,
  UploadResult,
} from "./storage.types";

// ── Supabase bucket seam (DI interface) ───────────────────────────────────────

export interface SupabaseStorageBucket {
  upload(
    path: string,
    file: File | Blob,
    options?: { contentType?: string },
  ): Promise<{ data: { path: string } | null; error: { message: string } | null }>;
  getPublicUrl(path: string): { data: { publicUrl: string } };
  createSignedUrl(
    path: string,
    expiresIn: number,
  ): Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
  remove(
    paths: string[],
  ): Promise<{ data: { name: string }[] | null; error: { message: string } | null }>;
}

export interface SupabaseStorageClient {
  from(bucket: string): SupabaseStorageBucket;
}

// ── Validation lookup tables (keyed by bucket value string) ───────────────────

const SIZE_LIMIT_BY_BUCKET: Record<string, number> = {
  [STORAGE_BUCKETS.PRODUCTS]: STORAGE_SIZE_LIMITS.PRODUCTS,
  [STORAGE_BUCKETS.STORE_LOGOS]: STORAGE_SIZE_LIMITS.STORE_LOGOS,
  [STORAGE_BUCKETS.VALIDATION_DOCS]: STORAGE_SIZE_LIMITS.VALIDATION_DOCS,
};

const ALLOWED_MIME_TYPES_BY_BUCKET: Record<string, readonly string[]> = {
  [STORAGE_BUCKETS.PRODUCTS]: STORAGE_ALLOWED_MIME_TYPES.PRODUCTS,
  [STORAGE_BUCKETS.STORE_LOGOS]: STORAGE_ALLOWED_MIME_TYPES.STORE_LOGOS,
  [STORAGE_BUCKETS.VALIDATION_DOCS]: STORAGE_ALLOWED_MIME_TYPES.VALIDATION_DOCS,
};

// ── Validation helper ─────────────────────────────────────────────────────────

function validateUpload(params: UploadParams): StorageResult<void> {
  const sizeLimit = SIZE_LIMIT_BY_BUCKET[params.bucket];
  if (params.file.size > sizeLimit) {
    return {
      success: false,
      error: `El archivo supera el tamaño máximo permitido (${Math.round(sizeLimit / 1024 / 1024)} MB).`,
    };
  }

  const allowedTypes = ALLOWED_MIME_TYPES_BY_BUCKET[params.bucket];
  if (!allowedTypes.includes(params.file.type)) {
    return {
      success: false,
      error: `Tipo de archivo no permitido. Formatos aceptados: ${allowedTypes.join(", ")}.`,
    };
  }

  return { success: true, data: undefined };
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createSupabaseStorageService(client?: SupabaseStorageClient): StorageService {
  function getClient(): SupabaseStorageClient {
    if (client) return client;
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ).storage;
  }

  return {
    async upload(params: UploadParams): Promise<StorageResult<UploadResult>> {
      const validation = validateUpload(params);
      if (!validation.success) return validation;

      const storage = getClient();
      const bucket = storage.from(params.bucket);

      const { data, error } = await bucket.upload(params.path, params.file, {
        contentType: params.file.type,
      });

      if (error || !data) {
        return { success: false, error: error?.message ?? "Error al subir el archivo." };
      }

      const { data: urlData } = bucket.getPublicUrl(data.path);

      return {
        success: true,
        data: { path: data.path, url: urlData.publicUrl },
      };
    },

    getPublicUrl(params: GetPublicUrlParams): string {
      const storage = getClient();
      const { data } = storage.from(params.bucket).getPublicUrl(params.path);
      return data.publicUrl;
    },

    async getSignedUrl(params: GetSignedUrlParams): Promise<StorageResult<string>> {
      const storage = getClient();
      const { data, error } = await storage
        .from(params.bucket)
        .createSignedUrl(params.path, params.expiresIn);

      if (error || !data) {
        return { success: false, error: error?.message ?? "Error al generar la URL firmada." };
      }

      return { success: true, data: data.signedUrl };
    },

    async remove(params: RemoveParams): Promise<StorageResult<void>> {
      const storage = getClient();
      const { error } = await storage.from(params.bucket).remove([...params.paths]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    },
  };
}

export const supabaseStorageService = createSupabaseStorageService();
