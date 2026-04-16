import { z } from "zod";
import { userRepository } from "@/shared/repositories";
import type { Session, User } from "@/shared/types/user";
import { USER_ROLES } from "@/shared/constants/user";
import { userRoleSchema } from "@/shared/schemas/user";
import { logger } from "@/shared/utils/logger";
import type { AuthService, AuthStateChangeCallback, SignInInput, SignUpInput } from "./auth.types";

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
  listeners.forEach((cb) => {
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
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    user,
  };
}

async function seedUser(seed: {
  email: string;
  role: User["role"];
  displayName: string;
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
    id: crypto.randomUUID(),
    email: seed.email,
    role: seed.role,
    displayName: seed.displayName,
  });
  credentials.set(seed.email, { userId: user.id, _unsafePasswordForMockOnly: MOCK_PASSWORD });
}

async function seedDefaultUsers(): Promise<void> {
  const seeds: Array<{ email: string; role: User["role"]; displayName: string }> = [
    { email: "client@test.com", role: USER_ROLES.client, displayName: "Cliente Test" },
    { email: "store@test.com", role: USER_ROLES.store, displayName: "Tienda Test" },
    { email: "admin@test.com", role: USER_ROLES.admin, displayName: "Admin Test" },
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
    notify(currentSession);
    return { success: true, data: currentSession };
  },

  async signOut() {
    currentSession = null;
    notify(null);
    return { success: true, data: undefined };
  },

  async getSession() {
    await seedPromise;
    return currentSession;
  },

  onAuthStateChange(callback: AuthStateChangeCallback) {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },
};
