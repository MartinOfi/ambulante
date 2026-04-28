import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";
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

function createBrowserClient() {
  return _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

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

function toUser(sbUser: SupabaseUser): User {
  return {
    id: sbUser.id,
    email: sbUser.email ?? "",
    role: extractRole(sbUser.user_metadata, sbUser.app_metadata),
    displayName:
      (sbUser.user_metadata?.["displayName"] as string | undefined) ??
      (sbUser.user_metadata?.["display_name"] as string | undefined),
  };
}

function toSession(sb: SupabaseSession): Session {
  return {
    accessToken: sb.access_token,
    refreshToken: sb.refresh_token,
    expiresAt: sb.expires_at ?? Math.floor(Date.now() / 1000) + sb.expires_in,
    user: toUser(sb.user),
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
      return { success: false, error: "Credenciales inválidas" };
    }
    return { success: true, data: toSession(data.session) };
  },

  async signUp(input: SignUpInput): Promise<AuthResult<Session | null>> {
    const client = createBrowserClient();
    const { data, error } = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { role: input.role ?? "client", displayName: input.displayName } },
    });
    if (error) {
      logger.error("signUp failed", { error });
      return { success: false, error: "No se pudo registrar la cuenta. Intentá de nuevo." };
    }
    // session is null when Supabase email confirmation is enabled — registration succeeded
    // but the user must confirm before a session is issued.
    if (!data.session) {
      return { success: true, data: null };
    }
    return { success: true, data: toSession(data.session) };
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
    const { error } = await client.auth.signOut();
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
    return toSession(data.session);
  },

  async getUser(): Promise<User | null> {
    const client = createBrowserClient();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return null;
    return toUser(data.user);
  },

  onAuthStateChange(callback: AuthStateChangeCallback): () => void {
    const client = createBrowserClient();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      callback(session ? toSession(session) : null);
    });
    return () => subscription.unsubscribe();
  },
};
