export interface RejectStoreDialogProps {
  readonly open: boolean;
  readonly isSubmitting: boolean;
  readonly onConfirm: (reason: string) => void;
  readonly onCancel: () => void;
}
