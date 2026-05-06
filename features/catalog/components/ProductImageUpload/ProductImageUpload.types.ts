export type UploadState = "idle" | "uploading" | "error";

export interface ProductImageUploadProps {
  readonly previewUrl: string | null;
  readonly uploadState: UploadState;
  readonly errorMessage: string | null;
  readonly urlInputValue: string;
  readonly onFileSelected: (file: File) => void;
  readonly onUrlInputChange: (value: string) => void;
  readonly onUrlInputCommit: (value: string) => void;
  readonly onPreviewError: () => void;
}

export interface ProductImageUploadContainerProps {
  readonly currentUrl: string | null;
  readonly onUploaded: (url: string) => void;
}
