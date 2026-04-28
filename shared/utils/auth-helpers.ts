import type { UserRole } from "@/shared/types/user";

// app_metadata is server-controlled; user_metadata is writable by the user.
// Always prefer app_metadata to prevent role self-escalation via updateUser().
export function extractRole(
  userMetadata?: Record<string, unknown>,
  appMetadata?: Record<string, unknown>,
): UserRole {
  const raw = appMetadata?.["role"] ?? userMetadata?.["role"];
  if (raw === "store" || raw === "admin") return raw;
  return "client";
}

// Prevents open-redirect: only allow same-origin relative paths as redirect targets.
// new URL(absolute, origin) ignores origin, so /^(https?:)?\/\// rejects absolute URLs.
export function safeRedirectPath(next: string | null | undefined, fallback: string): string {
  if (!next) return fallback;
  if (/^(https?:)?\/\//i.test(next)) return fallback;
  if (!next.startsWith("/")) return fallback;
  return next;
}
