import type { Session, User, UserRole } from "@/shared/types/user";

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

export interface MagicLinkInput {
  readonly email: string;
  readonly redirectTo?: string;
}

export interface OAuthInput {
  readonly redirectTo?: string;
}

export type AuthResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

export type AuthStateChangeCallback = (session: Session | null) => void;

export interface AuthService {
  signIn(input: SignInInput): Promise<AuthResult<Session>>;
  signUp(input: SignUpInput): Promise<AuthResult<Session | null>>;
  signInWithMagicLink(input: MagicLinkInput): Promise<AuthResult<void>>;
  signInWithGoogle(input?: OAuthInput): Promise<AuthResult<{ url: string | null }>>;
  signOut(): Promise<AuthResult<void>>;
  getSession(): Promise<Session | null>;
  getUser(): Promise<User | null>;
  onAuthStateChange(callback: AuthStateChangeCallback): () => void;
}
