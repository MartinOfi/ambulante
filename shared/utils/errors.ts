/**
 * Thrown when data is structurally invalid in a way that retrying the request
 * cannot fix (e.g., an unrecognised enum value from the DB). React Query's
 * shouldRetry skips retries for this class.
 */
export class NonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonRetryableError";
  }
}
