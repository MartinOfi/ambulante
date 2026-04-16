import { sessionSchema } from "@/shared/schemas/user";
import type { Session } from "@/shared/types/user";

export function parseSessionCookie(cookieValue: string): Session | null {
  if (!cookieValue) return null;

  try {
    const json = atob(cookieValue);
    const parsed: unknown = JSON.parse(json);
    const result = sessionSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function serializeSessionCookie(session: Session): string {
  return btoa(JSON.stringify(session));
}
