import { z } from "zod";
import { ORDER_STATUS } from "@/shared/constants/order";

export const orderStatusSchema = z.nativeEnum(ORDER_STATUS, {
  errorMap: () => ({ message: "Estado de pedido no válido" }),
});

export const orderItemSchema = z
  .object({
    productId: z
      .string({ required_error: "El ID de producto es obligatorio" })
      .min(1, "El ID de producto no puede estar vacío"),
    productName: z
      .string({ required_error: "El nombre de producto es obligatorio" })
      .min(1, "El nombre de producto no puede estar vacío"),
    productPriceArs: z
      .number({ required_error: "El precio de producto es obligatorio" })
      .positive("El precio de producto debe ser mayor a cero"),
    quantity: z
      .number({ required_error: "La cantidad es obligatoria" })
      .int("La cantidad debe ser un entero")
      .positive("La cantidad debe ser mayor a cero"),
  })
  .strict();

export const orderSchema = z
  .object({
    id: z.string({ required_error: "El ID es obligatorio" }).min(1, "El ID no puede estar vacío"),
    clientId: z
      .string({ required_error: "El ID de cliente es obligatorio" })
      .min(1, "El ID de cliente no puede estar vacío"),
    storeId: z
      .string({ required_error: "El ID de tienda es obligatorio" })
      .min(1, "El ID de tienda no puede estar vacío"),
    status: orderStatusSchema,
    items: z.array(orderItemSchema).min(1, "El pedido debe tener al menos un ítem"),
    notes: z.string().optional(),
    createdAt: z.string().datetime("La fecha de creación no es válida"),
    updatedAt: z.string().datetime("La fecha de actualización no es válida"),
  })
  .strict();

export type OrderItem = z.infer<typeof orderItemSchema>;
export type Order = z.infer<typeof orderSchema>;
