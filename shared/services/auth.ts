import { z } from "zod";
import { userRepository } from "@/shared/repositories";
import type { Session, User } from "@/shared/types/user";
import { USER_ROLES } from "@/shared/constants/user";
import { userRoleSchema } from "@/shared/schemas/user";
import { logger } from "@/shared/utils/logger";
import {
  writeSessionCookie,
  clearSessionCookie,
  parseSessionCookie,
} from "@/shared/utils/session-cookie";
import { SESSION_COOKIE_MAX_AGE_SECONDS, SESSION_COOKIE_NAME } from "@/shared/constants/auth";
import type {
  AuthService,
  AuthStateChangeCallback,
  MagicLinkInput,
  OAuthInput,
  SignInInput,
  SignUpInput,
} from "./auth.types";
import { SEED_USER_IDS } from "@/shared/repositories/mock/seeds";

export type { AuthService, SignInInput, SignUpInput };

const MOCK_PASSWORD = "password";

// client-side only — module-level state is safe in browser context;
// when Supabase lands, replace with `supabase.auth.getSession()` which is request-scoped.
let currentSession: Session | null = null;

interface StoredCredential {
  readonly userId: string;
  // MOCK ONLY — field renamed to make the danger explicit; never store plain passwords in production
  readonly _unsafePasswordForMockOnly: string;
}

const credentials = new Map<string, StoredCredential>();
const listeners = new Set<AuthStateChangeCallback>();

const signInInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signUpInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: userRoleSchema.optional(),
  displayName: z.string().optional(),
});

function notify(session: Session | null): void {
  // Snapshot before iteration so listeners added/removed mid-notify don't affect this call
  const snapshot = [...listeners];
  snapshot.forEach((cb) => {
    try {
      cb(session);
    } catch (err) {
      logger.error("Auth state change listener threw an error", { error: err });
    }
  });
}

function makeSession(user: User): Session {
  return {
    accessToken: `mock-access-${user.id}-${Date.now()}`,
    refreshToken: `mock-refresh-${user.id}-${Date.now()}`,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_COOKIE_MAX_AGE_SECONDS,
    user,
  };
}

async function seedUser(seed: {
  email: string;
  role: User["role"];
  displayName: string;
  id?: string;
}): Promise<void> {
  const existing = await userRepository.findByEmail(seed.email);
  if (existing) {
    credentials.set(seed.email, {
      userId: existing.id,
      _unsafePasswordForMockOnly: MOCK_PASSWORD,
    });
    return;
  }
  const user = await userRepository.create({
    id: seed.id ?? crypto.randomUUID(),
    email: seed.email,
    role: seed.role,
    displayName: seed.displayName,
  });
  credentials.set(seed.email, { userId: user.id, _unsafePasswordForMockOnly: MOCK_PASSWORD });
}

async function seedDefaultUsers(): Promise<void> {
  const seeds: Array<{ email: string; role: User["role"]; displayName: string; id: string }> = [
    {
      email: "client@test.com",
      role: USER_ROLES.client,
      displayName: "Cliente Test",
      id: SEED_USER_IDS.client,
    },
    {
      email: "store@test.com",
      role: USER_ROLES.store,
      displayName: "Tienda Test",
      id: SEED_USER_IDS.store,
    },
    {
      email: "admin@test.com",
      role: USER_ROLES.admin,
      displayName: "Admin Test",
      id: SEED_USER_IDS.admin,
    },
  ];

  await Promise.all(seeds.map(seedUser));
}

const seedPromise = seedDefaultUsers();

export const authService: AuthService = {
  async signIn(input: SignInInput) {
    const validation = signInInputSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: "Datos de acceso inválidos" };
    }
    const { email, password } = validation.data;

    await seedPromise;
    const cred = credentials.get(email);
    if (!cred) {
      return { success: false, error: "Credenciales inválidas" };
    }
    // MOCK ONLY — plain-text comparison; never do this in production
    if (cred._unsafePasswordForMockOnly !== password) {
      return { success: false, error: "Credenciales inválidas" };
    }
    const user = await userRepository.findById(cred.userId);
    if (!user) {
      return { success: false, error: "Usuario no encontrado" };
    }
    currentSession = makeSession(user);
    writeSessionCookie(currentSession);
    notify(currentSession);
    return { success: true, data: currentSession };
  },

  async signUp(input: SignUpInput) {
    const validation = signUpInputSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: "Datos de acceso inválidos" };
    }
    const { email, password, role = USER_ROLES.client, displayName } = validation.data;

    await seedPromise;
    if (credentials.has(email)) {
      return { success: false, error: "El email ya está registrado" };
    }
    const user = await userRepository.create({
      id: crypto.randomUUID(),
      email,
      role,
      displayName,
    });
    // MOCK ONLY — plain-text password storage; never do this in production
    credentials.set(email, { userId: user.id, _unsafePasswordForMockOnly: password });
    currentSession = makeSession(user);
    writeSessionCookie(currentSession);
    notify(currentSession);
    return { success: true, data: currentSession };
  },

  async signInWithMagicLink(_input: MagicLinkInput) {
    return { success: true as const, data: undefined };
  },

  async signInWithGoogle(_input?: OAuthInput) {
    return { success: false as const, error: "Google sign-in no disponible en modo mock" };
  },

  async getUser() {
    if (currentSession) return currentSession.user;
    return null;
  },

  async signOut() {
    try {
      currentSession = null;
      clearSessionCookie();
      notify(null);
      return { success: true, data: undefined };
    } catch (err) {
      logger.error("signOut failed", { error: err });
      return { success: false, error: "No se pudo cerrar la sesión. Intentá de nuevo." };
    }
  },

  async getSession() {
    await seedPromise;
    if (currentSession) return currentSession;

    // Hydrate from cookie after module reload (mock-only — Supabase will own this)
    if (typeof document !== "undefined") {
      const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${SESSION_COOKIE_NAME}=`));
      if (match) {
        const session = parseSessionCookie(match.split("=").slice(1).join("="));
        if (session) {
          currentSession = session;
          return currentSession;
        }
      }
    }

    return null;
  },

  onAuthStateChange(callback: AuthStateChangeCallback) {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },
};
