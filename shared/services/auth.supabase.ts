import { createBrowserClient } from "@/shared/repositories/supabase/client.browser";
import { logger } from "@/shared/utils/logger";
import { extractRole } from "@/shared/utils/auth-helpers";
import type { Session, User } from "@/shared/types/user";
import type {
  AuthResult,
  AuthService,
  AuthStateChangeCallback,
  MagicLinkInput,
  OAuthInput,
  SignInInput,
  SignUpInput,
} from "./auth.types";
import { USER_ROLES } from "@/shared/constants/user";

type BrowserClient = ReturnType<typeof createBrowserClient>;

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};

type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in: number;
  user: SupabaseUser;
};

// auth.users.id → public.users.public_id. Stable for the lifetime of the app.
const publicIdCache = new Map<string, string>();
// Deduplicates concurrent callers: stores the in-flight promise so parallel mounts
// don't each fire a separate HTTP request before the first one fills the cache.
const publicIdInFlight = new Map<string, Promise<string>>();

async function resolvePublicId(client: BrowserClient, authUserId: string): Promise<string> {
  const cached = publicIdCache.get(authUserId);
  if (cached !== undefined) return cached;

  const existing = publicIdInFlight.get(authUserId);
  if (existing !== undefined) return existing;

  const promise: Promise<string> = (async () => {
    try {
      const { data, error } = await client
        .from("users")
        .select("public_id")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      publicIdInFlight.delete(authUserId);

      if (error !== null || data === null) {
        logger.error("resolvePublicId failed — falling back to auth.uid()", { authUserId, error });
        return authUserId;
      }

      const publicId = (data as { public_id: string }).public_id;
      publicIdCache.set(authUserId, publicId);
      return publicId;
    } catch (err) {
      publicIdInFlight.delete(authUserId);
      logger.error("resolvePublicId threw — falling back to auth.uid()", { authUserId, err });
      return authUserId;
    }
  })();

  publicIdInFlight.set(authUserId, promise);
  return promise;
}

function toUser(publicId: string, sbUser: SupabaseUser): User {
  return {
    id: publicId,
    email: sbUser.email ?? "",
    role: extractRole(sbUser.user_metadata, sbUser.app_metadata),
    displayName:
      (sbUser.user_metadata?.["displayName"] as string | undefined) ??
      (sbUser.user_metadata?.["display_name"] as string | undefined),
  };
}

function toSession(publicId: string, sb: SupabaseSession): Session {
  return {
    accessToken: sb.access_token,
    refreshToken: sb.refresh_token,
    expiresAt: sb.expires_at ?? Math.floor(Date.now() / 1000) + sb.expires_in,
    user: toUser(publicId, sb.user),
  };
}

export const supabaseAuthService: AuthService = {
  async signIn(input: SignInInput): Promise<AuthResult<Session>> {
    const client = createBrowserClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error || !data.session) {
      logger.error("signIn failed", { error });
      if (error && "code" in error && error.code === "email_not_confirmed") {
        return {
          success: false,
          error:
            "Tenés que confirmar tu email antes de iniciar sesión. Revisá tu bandeja de entrada.",
        };
      }
      return { success: false, error: "Credenciales inválidas" };
    }
    const publicId = await resolvePublicId(client, data.session.user.id);
    return { success: true, data: toSession(publicId, data.session) };
  },

  async signUp(input: SignUpInput): Promise<AuthResult<Session | null>> {
    const client = createBrowserClient();
    const { data, error } = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { role: input.role ?? USER_ROLES.client, displayName: input.displayName } },
    });
    if (error) {
      logger.error("signUp failed", { error });
      const msg = error.message ?? "";
      if (/already registered|already exists|email.*in use/i.test(msg)) {
        return { success: false, error: "El correo electrónico ya está en uso." };
      }
      return { success: false, error: "No se pudo registrar la cuenta. Intentá de nuevo." };
    }
    // Supabase with email confirmation enabled silently "succeeds" for duplicate emails
    // but returns an empty identities array — detect this to surface a clear error.
    if (data.user?.identities !== undefined && data.user.identities.length === 0) {
      return { success: false, error: "El correo electrónico ya está en uso." };
    }
    // session is null when Supabase email confirmation is enabled — registration succeeded
    // but the user must confirm before a session is issued.
    if (!data.session) {
      return { success: true, data: null };
    }
    const publicId = await resolvePublicId(client, data.session.user.id);
    return { success: true, data: toSession(publicId, data.session) };
  },

  async signInWithMagicLink(input: MagicLinkInput): Promise<AuthResult<void>> {
    const client = createBrowserClient();
    const { error } = await client.auth.signInWithOtp({
      email: input.email,
      options: { emailRedirectTo: input.redirectTo },
    });
    if (error) {
      logger.error("signInWithMagicLink failed", { error });
      return { success: false, error: "No se pudo enviar el enlace mágico. Intentá de nuevo." };
    }
    return { success: true, data: undefined };
  },

  async signInWithGoogle(input?: OAuthInput): Promise<AuthResult<{ url: string | null }>> {
    const client = createBrowserClient();
    const { data, error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: input?.redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) {
      logger.error("signInWithGoogle failed", { error });
      return { success: false, error: "No se pudo iniciar sesión con Google. Intentá de nuevo." };
    }
    return { success: true, data: { url: data.url } };
  },

  async signOut(): Promise<AuthResult<void>> {
    const client = createBrowserClient();
    // scope: "local" revoca solo la sesión del browser actual. El default ("global")
    // invalida todas las sesiones del usuario en Supabase, lo que rompe los tests E2E
    // que comparten storageState entre tests (UC-CLI-19 dejaba inutilizable client.json
    // para UC-STO-18 y otros). Para una PWA "log out de este dispositivo" es la UX correcta.
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) {
      logger.error("signOut failed", { error });
      return { success: false, error: "No se pudo cerrar la sesión. Intentá de nuevo." };
    }
    return { success: true, data: undefined };
  },

  // NOTE: getSession() returns the locally-cached token WITHOUT server verification.
  // For security-sensitive checks (e.g. authorization gates) call getUser() instead,
  // which validates the JWT against the Supabase Auth server.
  async getSession(): Promise<Session | null> {
    const client = createBrowserClient();
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) return null;
    const publicId = await resolvePublicId(client, data.session.user.id);
    return toSession(publicId, data.session);
  },

  async getUser(): Promise<User | null> {
    const client = createBrowserClient();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return null;
    const publicId = await resolvePublicId(client, data.user.id);
    return toUser(publicId, data.user);
  },

  onAuthStateChange(callback: AuthStateChangeCallback): () => void {
    const client = createBrowserClient();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        callback(null);
        return;
      }
      const cached = publicIdCache.get(session.user.id);
      if (cached !== undefined) {
        callback(toSession(cached, session));
        return;
      }
      // Emit immediately with authUserId so consumers exit "loading" without
      // waiting for the DB lookup. A second emit follows once publicId resolves.
      callback(toSession(session.user.id, session));
      const publicId = await resolvePublicId(client, session.user.id);
      if (publicId !== session.user.id) {
        callback(toSession(publicId, session));
      }
    });
    return () => subscription.unsubscribe();
  },
};
