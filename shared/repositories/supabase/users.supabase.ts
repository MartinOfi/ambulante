import type { User } from "@/shared/schemas/user";
import type {
  UserRepository,
  UserFilters,
  CreateUserInput,
  UpdateUserInput,
} from "@/shared/repositories/user";
import type { SupabaseClient } from "./client";
import { mapUserRow, domainRoleToDb, type DbUserRow } from "./mappers";

const MAX_USERS_PER_QUERY = 500;

export class SupabaseUserRepository implements UserRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(filters?: UserFilters): Promise<readonly User[]> {
    let query = this.client
      .from("users")
      .select("public_id, role, display_name, email, suspended, avatar_url");

    if (filters?.role !== undefined) {
      query = query.eq("role", domainRoleToDb(filters.role));
    }
    if (filters?.suspended !== undefined) {
      query = query.eq("suspended", filters.suspended);
    }

    const limit = filters?.limit ?? MAX_USERS_PER_QUERY;
    const offset = filters?.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error !== null) throw new Error(`SupabaseUserRepository.findAll: ${error.message}`);
    return (data as DbUserRow[]).map(mapUserRow);
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from("users")
      .select("public_id, role, display_name, email, suspended, avatar_url")
      .eq("public_id", id)
      .maybeSingle();

    if (error !== null) throw new Error(`SupabaseUserRepository.findById: ${error.message}`);
    if (data === null) return null;
    return mapUserRow(data as DbUserRow);
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.client
      .from("users")
      .select("public_id, role, display_name, email, suspended, avatar_url")
      .eq("email", email)
      .maybeSingle();

    if (error !== null) throw new Error(`SupabaseUserRepository.findByEmail: ${error.message}`);
    if (data === null) return null;
    return mapUserRow(data as DbUserRow);
  }

  async findByAuthUserId(authUserId: string): Promise<User | null> {
    const { data, error } = await this.client
      .from("users")
      .select("public_id, role, display_name, email, suspended, avatar_url")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (error !== null)
      throw new Error(`SupabaseUserRepository.findByAuthUserId: ${error.message}`);
    if (data === null) return null;
    return mapUserRow(data as DbUserRow);
  }

  async create(input: CreateUserInput): Promise<User> {
    const { data, error } = await this.client
      .from("users")
      .insert({
        public_id: input.id,
        role: domainRoleToDb(input.role),
        display_name: input.displayName ?? null,
        email: input.email,
        suspended: input.suspended ?? false,
      })
      .select("public_id, role, display_name, email, suspended, avatar_url")
      .single();

    if (error !== null) throw new Error(`SupabaseUserRepository.create: ${error.message}`);
    return mapUserRow(data as DbUserRow);
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const patch: Record<string, unknown> = {};
    if (input.role !== undefined) patch.role = domainRoleToDb(input.role);
    if (input.displayName !== undefined) patch.display_name = input.displayName;
    if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;
    if (input.suspended !== undefined) patch.suspended = input.suspended;

    const { data, error } = await this.client
      .from("users")
      .update(patch)
      .eq("public_id", id)
      .select("public_id, role, display_name, email, suspended, avatar_url")
      .single();

    if (error !== null) throw new Error(`SupabaseUserRepository.update: ${error.message}`);
    return mapUserRow(data as DbUserRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("users").delete().eq("public_id", id);

    if (error !== null) throw new Error(`SupabaseUserRepository.delete: ${error.message}`);
  }
}
