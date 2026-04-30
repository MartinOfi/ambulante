export interface AvatarUploadProps {
  readonly currentUrl?: string;
  readonly isPending: boolean;
  readonly errorMessage?: string;
  readonly onFileSelected: (file: File) => void;
}
