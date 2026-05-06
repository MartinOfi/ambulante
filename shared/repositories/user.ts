import type { User, UserRole } from "@/shared/schemas/user";
import type { Repository } from "./base";

export interface UserFilters {
  readonly role?: UserRole;
  readonly suspended?: boolean;
  readonly limit?: number;
  readonly offset?: number;
}

export type CreateUserInput = User;
export type UpdateUserInput = Partial<Omit<User, "id" | "email" | "avatarUrl">> & {
  // null permite borrar explícitamente el avatar (SET avatar_url = NULL).
  readonly avatarUrl?: string | null;
};

export interface UserRepository extends Repository<
  User,
  CreateUserInput,
  UpdateUserInput,
  UserFilters
> {
  findByEmail(email: string): Promise<User | null>;
  findByAuthUserId(authUserId: string): Promise<User | null>;
}
