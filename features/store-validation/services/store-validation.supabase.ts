import type { SupabaseClient } from "@/shared/repositories/supabase/client";
import { dbCategoryToKind } from "@/shared/repositories/supabase/mappers";
import { STORE_VALIDATION_STATUS } from "@/features/store-validation/constants";
import { PLACEHOLDER_STORE_PHOTO_URL } from "@/shared/constants/store";
import type { StoreValidationService } from "@/features/store-validation/services/store-validation.service";
import type {
  GetValidationDocInput,
  PendingStore,
  RejectStoreInput,
  ValidationDocMeta,
  ValidationStatus,
} from "@/features/store-validation/types/store-validation.types";

// Queries stores directly (bypasses stores_view which filters by is_admin() — broken with service role).
// lat/lng not needed in admin validation context.
const VALIDATION_SELECT =
  "id, public_id, name, description, category, available, " +
  "photo_url, tagline, price_from_ars, hours, cuit, " +
  "validation_status, rejection_reason, created_at, " +
  "users!stores_owner_id_fkey(public_id)";

interface DbStoreDirectRow {
  readonly id: number;
  readonly public_id: string;
  readonly name: string;
  readonly description: string | null;
  readonly category: string | null;
  readonly available: boolean;
  readonly photo_url: string | null;
  readonly tagline: string | null;
  readonly price_from_ars: number | string | null;
  readonly hours: string | null;
  readonly cuit: string | null;
  readonly validation_status: string;
  readonly rejection_reason: string | null;
  readonly created_at: string;
  readonly users: { readonly public_id: string } | null;
}

function mapStoreDirectRow(row: DbStoreDirectRow): PendingStore {
  return {
    id: row.public_id,
    ownerId: row.users?.public_id ?? "",
    name: row.name,
    description: row.description ?? undefined,
    kind: dbCategoryToKind(row.category),
    status: row.available ? "open" : "closed",
    photoUrl: row.photo_url ?? PLACEHOLDER_STORE_PHOTO_URL,
    tagline: row.tagline ?? "",
    priceFromArs: row.price_from_ars !== null ? Number(row.price_from_ars) : 0,
    hours: row.hours ?? undefined,
    cuit: row.cuit ?? undefined,
    validationStatus: row.validation_status as ValidationStatus,
    rejectionReason: row.rejection_reason ?? undefined,
    location: null,
    distanceMeters: 0,
  };
}

export class SupabaseStoreValidationService implements StoreValidationService {
  constructor(private readonly client: SupabaseClient) {}

  async getPendingStores(): Promise<readonly PendingStore[]> {
    return this.getStoresByStatus(STORE_VALIDATION_STATUS.pending);
  }

  async getStoresByStatus(status: ValidationStatus): Promise<readonly PendingStore[]> {
    const { data, error } = await this.client
      .from("stores")
      .select(VALIDATION_SELECT)
      .eq("validation_status", status)
      .order("created_at", { ascending: true });

    if (error !== null) throw new Error(`getStoresByStatus: ${error.message}`);
    return (data as unknown as DbStoreDirectRow[]).map(mapStoreDirectRow);
  }

  async getStoreById(id: string): Promise<PendingStore | null> {
    const { data, error } = await this.client
      .from("stores")
      .select(VALIDATION_SELECT)
      .eq("public_id", id)
      .maybeSingle();

    if (error !== null) throw new Error(`getStoreById: ${error.message}`);
    if (data === null) return null;
    return mapStoreDirectRow(data as unknown as DbStoreDirectRow);
  }

  async approveStore(storeId: string): Promise<PendingStore> {
    const { error } = await this.client
      .from("stores")
      .update({ validation_status: STORE_VALIDATION_STATUS.approved })
      .eq("public_id", storeId);

    if (error !== null) throw new Error(`approveStore: ${error.message}`);

    const updated = await this.getStoreById(storeId);
    if (updated === null) throw new Error(`approveStore: tienda no encontrada: ${storeId}`);
    return updated;
  }

  async rejectStore({ storeId, reason }: RejectStoreInput): Promise<PendingStore> {
    const { error } = await this.client
      .from("stores")
      .update({
        validation_status: STORE_VALIDATION_STATUS.rejected,
        rejection_reason: reason,
      })
      .eq("public_id", storeId);

    if (error !== null) throw new Error(`rejectStore: ${error.message}`);

    const updated = await this.getStoreById(storeId);
    if (updated === null) throw new Error(`rejectStore: tienda no encontrada: ${storeId}`);
    return updated;
  }

  async getValidationDoc({
    storeId,
    docType,
  }: GetValidationDocInput): Promise<ValidationDocMeta | null> {
    // Resolve public UUID → internal bigint (storage paths use: store-<bigint>/<filename>)
    const { data: storeRow, error: storeError } = await this.client
      .from("stores")
      .select("id")
      .eq("public_id", storeId)
      .single();

    if (storeError !== null) throw new Error(`getValidationDoc store: ${storeError.message}`);
    if (storeRow === null) return null;

    const folder = `store-${(storeRow as { id: number }).id}`;

    const { data: files, error: listError } = await this.client.storage
      .from("validation-docs")
      .list(folder);

    if (listError !== null) throw new Error(`getValidationDoc storage: ${listError.message}`);
    if (!files) return null;

    // File naming convention: <docType>.<ext>  (e.g., id_front.jpg, business_proof.pdf)
    const docFile = files.find((f) => f.name.split(".")[0] === docType);
    if (!docFile) return null;

    return {
      path: `${folder}/${docFile.name}`,
      mimeType: (docFile.metadata as { mimetype?: string })?.mimetype ?? "application/octet-stream",
      filename: docFile.name,
    };
  }
}
