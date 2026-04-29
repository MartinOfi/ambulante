export interface SuspendConfirmDialogProps {
  readonly isOpen: boolean;
  readonly userEmail: string;
  readonly reason: string;
  readonly isPending: boolean;
  readonly errorMessage: string | null;
  readonly onReasonChange: (reason: string) => void;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}
