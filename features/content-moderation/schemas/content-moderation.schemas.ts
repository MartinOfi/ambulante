import { z } from "zod";
import { REPORT_STATUS, REPORT_REASON } from "@/features/content-moderation/constants";

export const reportStatusSchema = z.nativeEnum(REPORT_STATUS, {
  errorMap: () => ({ message: "Estado de reporte no válido" }),
});

export const reportReasonSchema = z.nativeEnum(REPORT_REASON, {
  errorMap: () => ({ message: "Razón de reporte no válida" }),
});

export const reportSchema = z
  .object({
    id: z.string().min(1),
    productId: z.string().min(1),
    productName: z.string().min(1),
    productPhotoUrl: z.string().url("La URL de la foto no es válida").optional(),
    storeId: z.string().min(1),
    storeName: z.string().min(1),
    reason: reportReasonSchema,
    status: reportStatusSchema,
    reportedAt: z.string().datetime(),
    reportedById: z.string().min(1),
  })
  .strict();

export type Report = z.infer<typeof reportSchema>;
