import { z } from "zod";
import { MAX_CANCEL_REASON_LENGTH } from "@/features/orders/cancel.constants";

export const cancelOrderInputSchema = z
  .object({
    publicId: z
      .string({ required_error: "El ID del pedido es obligatorio" })
      .uuid("El ID del pedido debe ser un UUID válido"),
    reason: z
      .string()
      .max(
        MAX_CANCEL_REASON_LENGTH,
        `El motivo puede tener hasta ${MAX_CANCEL_REASON_LENGTH} caracteres`,
      )
      .optional(),
  })
  .strict();

export type CancelOrderInput = z.infer<typeof cancelOrderInputSchema>;
