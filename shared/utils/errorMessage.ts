import { MUTATION_ERROR_MESSAGE, QUERY_ERROR_MESSAGE } from "@/shared/constants/ui-messages";

type ErrorContext = "query" | "mutation";

function hasNumericStatus(value: unknown): value is { status: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    typeof (value as Record<string, unknown>).status === "number"
  );
}

function isClientError(error: unknown): boolean {
  if (!hasNumericStatus(error)) return false;
  return error.status >= 400 && error.status < 500;
}

export function extractErrorMessage(
  error: unknown,
  context: ErrorContext = "query",
): string | null {
  if (isClientError(error)) return null;
  return context === "mutation" ? MUTATION_ERROR_MESSAGE : QUERY_ERROR_MESSAGE;
}
