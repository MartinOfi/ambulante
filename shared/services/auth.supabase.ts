import { createBrowserClient } from "@supabase/ssr";

import type { Session } from "@/shared/types/user";

import type {
  AuthResult,
  AuthService,
  AuthStateChangeCallback,
  SignInInput,
  SignUpInput,
} from "./auth.types";

export function createAuthClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export const supabaseAuthService: AuthService = {
  async signIn(_input: SignInInput): Promise<AuthResult<Session>> {
    throw new Error("TODO — implementar en B4");
  },
  async signUp(_input: SignUpInput): Promise<AuthResult<Session>> {
    throw new Error("TODO — implementar en B4");
  },
  async signOut(): Promise<AuthResult<void>> {
    throw new Error("TODO — implementar en B4");
  },
  async getSession(): Promise<Session | null> {
    throw new Error("TODO — implementar en B4");
  },
  onAuthStateChange(_callback: AuthStateChangeCallback): () => void {
    throw new Error("TODO — implementar en B4");
  },
};
