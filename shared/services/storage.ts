import { MOCK_STORAGE_BASE_URL } from "@/shared/constants/storage";

import type {
  GetPublicUrlParams,
  RemoveParams,
  StorageResult,
  StorageService,
  UploadParams,
  UploadResult,
} from "./storage.types";

export const storageService: StorageService = {
  async upload({ bucket, path }: UploadParams): Promise<StorageResult<UploadResult>> {
    return {
      success: true,
      data: {
        path,
        url: `${MOCK_STORAGE_BASE_URL}/${bucket}/${path}`,
      },
    };
  },

  async remove(_params: RemoveParams): Promise<StorageResult<void>> {
    return { success: true, data: undefined };
  },

  getPublicUrl({ bucket, path }: GetPublicUrlParams): string {
    return `${MOCK_STORAGE_BASE_URL}/${bucket}/${path}`;
  },
};
