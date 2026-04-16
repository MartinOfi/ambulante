import { userRepository } from "@/shared/repositories";
import type { Session, User } from "@/shared/types/user";
import { USER_ROLES } from "@/shared/constants/user";
import type { AuthService, AuthStateChangeCallback, SignInInput, SignUpInput } from "./auth.types";

export type { AuthService, SignInInput, SignUpInput };

const MOCK_PASSWORD = "password";

interface StoredCredential {
  readonly userId: string;
  readonly passwordHash: string;
}

const credentials = new Map<string, StoredCredential>();
let currentSession: Session | null = null;
const listeners = new Set<AuthStateChangeCallback>();

function notify(session: Session | null): void {
  listeners.forEach((cb) => cb(session));
}

function makeSession(user: User): Session {
  return {
    accessToken: `mock-access-${user.id}-${Date.now()}`,
    refreshToken: `mock-refresh-${user.id}-${Date.now()}`,
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    user,
  };
}

async function seedDefaultUsers(): Promise<void> {
  const seeds: Array<{ email: string; role: User["role"]; displayName: string }> = [
    { email: "client@test.com", role: USER_ROLES.client, displayName: "Cliente Test" },
    { email: "store@test.com", role: USER_ROLES.store, displayName: "Tienda Test" },
    { email: "admin@test.com", role: USER_ROLES.admin, displayName: "Admin Test" },
  ];

  for (const seed of seeds) {
    const existing = await userRepository.findByEmail(seed.email);
    if (existing) {
      credentials.set(seed.email, {
        userId: existing.id,
        passwordHash: MOCK_PASSWORD,
      });
      continue;
    }
    const user = await userRepository.create({
      id: crypto.randomUUID(),
      email: seed.email,
      role: seed.role,
      displayName: seed.displayName,
    });
    credentials.set(seed.email, { userId: user.id, passwordHash: MOCK_PASSWORD });
  }
}

const seedPromise = seedDefaultUsers();

export const authService: AuthService = {
  async signIn({ email, password }: SignInInput) {
    await seedPromise;
    const cred = credentials.get(email);
    if (!cred) {
      return { success: false, error: "Credenciales inválidas" };
    }
    if (cred.passwordHash !== password) {
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

  async signUp({ email, password, role = USER_ROLES.client }: SignUpInput) {
    await seedPromise;
    if (credentials.has(email)) {
      return { success: false, error: "El email ya está registrado" };
    }
    const user = await userRepository.create({ id: crypto.randomUUID(), email, role });
    credentials.set(email, { userId: user.id, passwordHash: password });
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
