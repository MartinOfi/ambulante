export interface UploadParams {
  readonly bucket: string;
  readonly path: string;
  readonly file: Blob | File;
}

export interface RemoveParams {
  readonly bucket: string;
  readonly paths: string[];
}

export interface GetPublicUrlParams {
  readonly bucket: string;
  readonly path: string;
}

export type StorageResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

export interface UploadResult {
  readonly path: string;
  readonly url: string;
}

export interface StorageService {
  upload(params: UploadParams): Promise<StorageResult<UploadResult>>;
  remove(params: RemoveParams): Promise<StorageResult<void>>;
  getPublicUrl(params: GetPublicUrlParams): string;
}
