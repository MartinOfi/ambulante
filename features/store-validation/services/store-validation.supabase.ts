import type { SupabaseClient } from "@/shared/repositories/supabase/client";
import { mapStoreRow, type DbStoreViewRow } from "@/shared/repositories/supabase/mappers";
import { STORE_VALIDATION_STATUS } from "@/features/store-validation/constants";
import type { StoreValidationService } from "@/features/store-validation/services/store-validation.service";
import type {
  GetValidationDocInput,
  PendingStore,
  RejectStoreInput,
  ValidationDocMeta,
  ValidationStatus,
} from "@/features/store-validation/types/store-validation.types";

// Includes internal `id` (bigint) needed to build the validation-docs storage path.
const VALIDATION_SELECT =
  "id, public_id, owner_public_id, name, description, category, available, " +
  "photo_url, tagline, price_from_ars, hours, lat, lng, cuit, " +
  "validation_status, rejection_reason, created_at";

interface DbValidationStoreRow extends DbStoreViewRow {
  readonly id: number;
  readonly validation_status: string;
  readonly rejection_reason: string | null;
  readonly created_at: string;
}

function mapValidationRow(row: DbValidationStoreRow): PendingStore {
  return {
    ...mapStoreRow(row),
    validationStatus: row.validation_status as ValidationStatus,
    rejectionReason: row.rejection_reason ?? undefined,
  };
}

export class SupabaseStoreValidationService implements StoreValidationService {
  constructor(private readonly client: SupabaseClient) {}

  async getPendingStores(): Promise<readonly PendingStore[]> {
    const { data, error } = await this.client
      .from("stores_view")
      .select(VALIDATION_SELECT)
      .eq("validation_status", STORE_VALIDATION_STATUS.pending)
      .order("created_at", { ascending: true });

    if (error !== null) throw new Error(`getPendingStores: ${error.message}`);
    return (data as unknown as DbValidationStoreRow[]).map(mapValidationRow);
  }

  async getStoreById(id: string): Promise<PendingStore | null> {
    const { data, error } = await this.client
      .from("stores_view")
      .select(VALIDATION_SELECT)
      .eq("public_id", id)
      .maybeSingle();

    if (error !== null) throw new Error(`getStoreById: ${error.message}`);
    if (data === null) return null;
    return mapValidationRow(data as unknown as DbValidationStoreRow);
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
