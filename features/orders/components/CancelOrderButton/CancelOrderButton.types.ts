export interface CancelOrderButtonProps {
  readonly isConfirming: boolean;
  readonly isLoading: boolean;
  readonly errorMessage?: string;
  readonly onCancelClick: () => void;
  readonly onConfirmCancel: () => void;
  readonly onDismissConfirm: () => void;
}
