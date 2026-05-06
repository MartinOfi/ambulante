export type UploadState = "idle" | "uploading" | "error";

export interface ProductImageUploadProps {
  readonly currentUrl: string | null;
  readonly uploadState: UploadState;
  readonly errorMessage: string | null;
  readonly onFileSelected: (file: File) => void;
}

export interface ProductImageUploadContainerProps {
  readonly currentUrl: string | null;
  readonly onUploaded: (url: string) => void;
}
