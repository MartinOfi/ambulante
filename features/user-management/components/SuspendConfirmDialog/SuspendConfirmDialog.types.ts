export interface SuspendConfirmDialogProps {
  readonly isOpen: boolean;
  readonly userEmail: string;
  readonly isPending: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}
