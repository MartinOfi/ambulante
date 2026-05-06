import type { SupabaseClient } from "@/shared/repositories/supabase/client";
import { REPORT_STATUS } from "@/features/content-moderation/constants";
import {
  reportSchema,
  type Report,
} from "@/features/content-moderation/schemas/content-moderation.schemas";
import type {
  ContentModerationService,
  ListReportsInput,
} from "@/features/content-moderation/services/content-moderation.service";

// product_id (raw FK) is included so removeContent can disable the product without
// an extra round-trip.
const REPORT_SELECT =
  "public_id, reason, status, created_at, product_id, " +
  "reporter:users!reported_by(public_id), " +
  "product:products!product_id(" +
  "  public_id, name, image_url, " +
  "  store:stores!store_id(public_id, name)" +
  ")";

interface DbProductReportRow {
  readonly public_id: string;
  readonly reason: string;
  readonly status: string;
  readonly created_at: string;
  readonly product_id: number;
  readonly reporter: { readonly public_id: string } | null;
  readonly product: {
    readonly public_id: string;
    readonly name: string;
    readonly image_url: string | null;
    readonly store: { readonly public_id: string; readonly name: string } | null;
  } | null;
}

function mapReportRow(row: DbProductReportRow): Report {
  return reportSchema.parse({
    id: row.public_id,
    productId: row.product?.public_id ?? "",
    productName: row.product?.name ?? "",
    productPhotoUrl: row.product?.image_url ?? undefined,
    storeId: row.product?.store?.public_id ?? "",
    storeName: row.product?.store?.name ?? "",
    reason: row.reason,
    status: row.status,
    reportedAt: row.created_at,
    reportedById: row.reporter?.public_id ?? "",
  });
}

export function createSupabaseContentModerationService(
  client: SupabaseClient,
): ContentModerationService {
  return {
    async listReports(input?: ListReportsInput): Promise<readonly Report[]> {
      let query = client
        .from("product_reports")
        .select(REPORT_SELECT)
        .order("created_at", { ascending: false });

      if (input?.status !== undefined) {
        query = query.eq("status", input.status);
      }

      const { data, error } = await query;
      if (error !== null) throw new Error(`listReports: ${error.message}`);
      return (data as unknown as DbProductReportRow[]).map(mapReportRow);
    },

    async removeContent(reportId: string): Promise<Report> {
      // Update report status first — the returned row carries product_id needed below.
      const { data, error } = await client
        .from("product_reports")
        .update({ status: REPORT_STATUS.RESOLVED })
        .eq("public_id", reportId)
        .select(REPORT_SELECT)
        .single();

      if (error !== null) throw new Error(`removeContent: ${error.message}`);

      const row = data as unknown as DbProductReportRow;

      // Disable the reported product (distinct from dismissReport which only changes the report).
      const { error: productError } = await client
        .from("products")
        .update({ available: false })
        .eq("id", row.product_id);

      if (productError !== null) throw new Error(`removeContent product: ${productError.message}`);

      return mapReportRow(row);
    },

    async dismissReport(reportId: string): Promise<Report> {
      const { data, error } = await client
        .from("product_reports")
        .update({ status: REPORT_STATUS.DISMISSED })
        .eq("public_id", reportId)
        .select(REPORT_SELECT)
        .single();

      if (error !== null) throw new Error(`dismissReport: ${error.message}`);
      return mapReportRow(data as unknown as DbProductReportRow);
    },
  };
}
