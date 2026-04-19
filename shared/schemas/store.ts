import { z } from "zod";
import { coordinatesSchema } from "@/shared/schemas/coordinates";

export const storeKindSchema = z.enum(["food-truck", "street-cart", "ice-cream"], {
  errorMap: () => ({ message: "Tipo de tienda no válido" }),
});

export const storeStatusSchema = z.enum(["open", "closed", "stale"], {
  errorMap: () => ({ message: "Estado de tienda no válido" }),
});

export const storeSchema = z
  .object({
    id: z.string({ required_error: "El ID es obligatorio" }).min(1, "El ID no puede estar vacío"),
    name: z
      .string({ required_error: "El nombre es obligatorio" })
      .min(1, "El nombre no puede estar vacío"),
    kind: storeKindSchema,
    photoUrl: z.string().url("La URL de la foto no es válida"),
    location: coordinatesSchema,
    distanceMeters: z
      .number({ required_error: "La distancia es obligatoria" })
      .min(0, "La distancia no puede ser negativa"),
    status: storeStatusSchema,
    priceFromArs: z
      .number({ required_error: "El precio es obligatorio" })
      .min(0, "El precio no puede ser negativo"),
    tagline: z.string({ required_error: "El tagline es obligatorio" }),
    ownerId: z
      .string({ required_error: "El ID del dueño es obligatorio" })
      .uuid("El ID del dueño debe ser un UUID válido"),
    description: z.string().optional(),
    hours: z.string().optional(),
  })
  .strict();

export type StoreKind = z.infer<typeof storeKindSchema>;
export type StoreStatus = z.infer<typeof storeStatusSchema>;
export type Store = z.infer<typeof storeSchema>;
