import type { Session, UserRole } from "@/shared/types/user";

export interface SignInInput {
  readonly email: string;
  readonly password: string;
}

export interface SignUpInput {
  readonly email: string;
  readonly password: string;
  readonly role?: UserRole;
  readonly displayName?: string;
}

export type AuthResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

export type AuthStateChangeCallback = (session: Session | null) => void;

export interface AuthService {
  signIn(input: SignInInput): Promise<AuthResult<Session>>;
  signUp(input: SignUpInput): Promise<AuthResult<Session>>;
  signOut(): Promise<AuthResult<void>>;
  getSession(): Promise<Session | null>;
  onAuthStateChange(callback: AuthStateChangeCallback): () => void;
}
