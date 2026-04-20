import type { User, UserRole } from "@/shared/schemas/user";
import type { Repository } from "./base";

export interface UserFilters {
  readonly role?: UserRole;
  readonly suspended?: boolean;
}

export type CreateUserInput = User;
export type UpdateUserInput = Partial<Omit<User, "id" | "email">>;

export interface UserRepository extends Repository<
  User,
  CreateUserInput,
  UpdateUserInput,
  UserFilters
> {
  findByEmail(email: string): Promise<User | null>;
}
