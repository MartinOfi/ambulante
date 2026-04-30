import { z } from "zod";

export const storeOrderTransitionInputSchema = z
  .object({
    publicId: z
      .string({ required_error: "El ID del pedido es obligatorio." })
      .uuid("El ID del pedido debe ser un UUID válido."),
  })
  .strict();

export type StoreOrderTransitionInput = z.infer<typeof storeOrderTransitionInputSchema>;
