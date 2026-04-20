import { z } from "zod";
import {
  REJECTION_REASON_MIN_LENGTH,
  REJECTION_REASON_MAX_LENGTH,
} from "@/features/store-validation/constants";

export const rejectStoreSchema = z.object({
  reason: z
    .string({ required_error: "El motivo de rechazo es obligatorio" })
    .min(
      REJECTION_REASON_MIN_LENGTH,
      `El motivo debe tener al menos ${REJECTION_REASON_MIN_LENGTH} caracteres`,
    )
    .max(
      REJECTION_REASON_MAX_LENGTH,
      `El motivo no puede superar los ${REJECTION_REASON_MAX_LENGTH} caracteres`,
    ),
});

export type RejectStoreFormValues = z.infer<typeof rejectStoreSchema>;
