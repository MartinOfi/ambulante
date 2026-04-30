export interface DisplayNameFieldProps {
  readonly initialValue: string;
  readonly isPending: boolean;
  readonly errorMessage?: string;
  readonly onSubmit: (value: string) => void;
}
