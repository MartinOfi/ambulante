import type { User } from "@/shared/schemas/user";
import type {
  UserRepository,
  UserFilters,
  CreateUserInput,
  UpdateUserInput,
} from "@/shared/repositories/user";
import { logger } from "@/shared/utils/logger";

function applyFilters(users: readonly User[], filters?: UserFilters): readonly User[] {
  if (!filters) return users;
  return users.filter((user) => {
    if (filters.role !== undefined && user.role !== filters.role) return false;
    if (filters.suspended !== undefined && (user.suspended ?? false) !== filters.suspended) {
      return false;
    }
    return true;
  });
}

export class MockUserRepository implements UserRepository {
  private users: User[] = [];

  async findAll(filters?: UserFilters): Promise<readonly User[]> {
    return applyFilters(this.users, filters);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async findByAuthUserId(_authUserId: string): Promise<User | null> {
    // Mock no mantiene mapping auth_user_id → User. El dominio User no expone
    // authUserId; quien necesite resolver desde Supabase Auth usa la impl real.
    return null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const newUser: User = { ...input };
    this.users = [...this.users, newUser];
    return newUser;
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) {
      logger.error("MockUserRepository.update: user not found", { id });
      throw new Error(`User with id "${id}" not found`);
    }
    const { avatarUrl: avatarUrlPatch, ...rest } = input;
    const next: User = { ...this.users[index], ...rest };
    if (avatarUrlPatch !== undefined) {
      next.avatarUrl = avatarUrlPatch ?? undefined;
    }
    this.users = [...this.users.slice(0, index), next, ...this.users.slice(index + 1)];
    return next;
  }

  async delete(id: string): Promise<void> {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) {
      logger.error("MockUserRepository.delete: user not found", { id });
      throw new Error(`User with id "${id}" not found`);
    }
    this.users = this.users.filter((user) => user.id !== id);
  }
}

export const userRepository: UserRepository = new MockUserRepository();
