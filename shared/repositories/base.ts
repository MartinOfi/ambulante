/**
 * Base repository interface that all domain repositories extend.
 * Designed for a clean mock → Supabase swap without touching consumers.
 */

export interface Repository<Entity, CreateInput, UpdateInput, Filters = Record<string, never>> {
  findAll(filters?: Filters): Promise<readonly Entity[]>;
  findById(id: string): Promise<Entity | null>;
  create(input: CreateInput): Promise<Entity>;
  update(id: string, input: UpdateInput): Promise<Entity>;
  delete(id: string): Promise<void>;
}
