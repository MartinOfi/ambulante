import { z } from "zod";

export const productSchema = z
  .object({
    id: z
      .string({ required_error: "El ID es obligatorio" })
      .min(1, "El ID no puede estar vacío"),
    storeId: z
      .string({ required_error: "El ID de tienda es obligatorio" })
      .min(1, "El ID de tienda no puede estar vacío"),
    name: z
      .string({ required_error: "El nombre es obligatorio" })
      .min(1, "El nombre no puede estar vacío"),
    description: z.string().optional(),
    priceArs: z
      .number({ required_error: "El precio es obligatorio" })
      .positive("El precio debe ser mayor a cero"),
    photoUrl: z.string().url("La URL de la foto no es válida").optional(),
    isAvailable: z.boolean({ required_error: "La disponibilidad es obligatoria" }),
  })
  .strict();

export type Product = z.infer<typeof productSchema>;
