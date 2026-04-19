import { z } from "zod";
import { productSchema } from "./product";

export const cartItemSchema = z
  .object({
    product: productSchema,
    quantity: z
      .number()
      .int("La cantidad debe ser un número entero")
      .positive("La cantidad debe ser mayor a cero"),
  })
  .strict();

export const cartStateSchema = z
  .object({
    storeId: z.string().min(1).nullable(),
    items: z.array(cartItemSchema),
  })
  .strict();

export type CartItem = z.infer<typeof cartItemSchema>;
export type CartState = z.infer<typeof cartStateSchema>;
