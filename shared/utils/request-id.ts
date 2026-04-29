import { REQUEST_ID_HEADER } from "@/shared/constants/observability";

const MAX_REQUEST_ID_LENGTH = 128;

// Reject \r/\n/\0 to prevent header-injection when echoing the id back in
// X-Request-Id on the response.
const FORBIDDEN_CHARS = /[\r\n\0]/;

export function isValidRequestId(value: string): boolean {
  if (value.length === 0 || value.length > MAX_REQUEST_ID_LENGTH) return false;
  return !FORBIDDEN_CHARS.test(value);
}

export function getRequestId(headers: Headers): string | null {
  const raw = headers.get(REQUEST_ID_HEADER);
  if (raw === null) return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function readOrCreateRequestId(headers: Headers): string {
  const incoming = getRequestId(headers);
  if (incoming !== null && isValidRequestId(incoming)) return incoming;
  return crypto.randomUUID();
}
