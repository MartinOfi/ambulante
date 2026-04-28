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
