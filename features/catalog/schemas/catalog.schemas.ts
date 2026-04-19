import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string({ required_error: "El nombre es obligatorio" })
    .min(1, "El nombre no puede estar vacío")
    .max(80, "El nombre no puede superar los 80 caracteres"),
  description: z.string().max(300, "La descripción no puede superar los 300 caracteres").optional(),
  priceArs: z
    .number({
      required_error: "El precio es obligatorio",
      invalid_type_error: "Ingresá un precio válido",
    })
    .positive("El precio debe ser mayor a cero"),
  photoUrl: z.string().url("La URL de la foto no es válida").optional().or(z.literal("")),
  isAvailable: z.boolean({ required_error: "La disponibilidad es obligatoria" }),
});

export const editProductSchema = createProductSchema;

export type CreateProductValues = z.infer<typeof createProductSchema>;
export type EditProductValues = z.infer<typeof editProductSchema>;
