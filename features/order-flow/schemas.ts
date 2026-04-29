import { z } from "zod";
import {
  MAX_ITEMS_PER_ORDER,
  MAX_NOTE_LENGTH,
  MAX_QUANTITY_PER_ITEM,
} from "@/features/order-flow/constants";

export const submitOrderItemSchema = z
  .object({
    productId: z
      .string({ required_error: "El ID de producto es obligatorio" })
      .uuid("El ID de producto debe ser un UUID válido"),
    quantity: z
      .number({ required_error: "La cantidad es obligatoria" })
      .int("La cantidad debe ser un entero")
      .positive("La cantidad debe ser mayor a cero")
      .max(MAX_QUANTITY_PER_ITEM, `La cantidad máxima por ítem es ${MAX_QUANTITY_PER_ITEM}`),
  })
  .strict();

export const submitOrderInputSchema = z
  .object({
    storeId: z
      .string({ required_error: "El ID de tienda es obligatorio" })
      .uuid("El ID de tienda debe ser un UUID válido"),
    items: z
      .array(submitOrderItemSchema)
      .min(1, "El pedido debe tener al menos un ítem")
      .max(MAX_ITEMS_PER_ORDER, `Demasiados ítems (máximo ${MAX_ITEMS_PER_ORDER})`),
    notes: z
      .string()
      .max(MAX_NOTE_LENGTH, `La nota puede tener hasta ${MAX_NOTE_LENGTH} caracteres`)
      .optional(),
  })
  .strict();

export type SubmitOrderItemInput = z.infer<typeof submitOrderItemSchema>;
export type SubmitOrderInput = z.infer<typeof submitOrderInputSchema>;
