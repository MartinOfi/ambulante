import { z } from "zod";
import { storeKindSchema } from "@/shared/schemas/store";

export const PROFILE_DAYS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
] as const;

export type ProfileDay = (typeof PROFILE_DAYS)[number];

const CLOSE_AFTER_OPEN_MESSAGE = "El horario de cierre debe ser posterior al de apertura";
const CLOSE_AFTER_OPEN_PATH = ["closeTime"];

const profileBaseSchema = z.object({
  storeId: z.string().min(1, "El ID de la tienda es obligatorio"),
  businessName: z
    .string({ required_error: "El nombre del negocio es obligatorio" })
    .min(1, "El nombre del negocio no puede estar vacío")
    .max(100, "El nombre no puede superar los 100 caracteres"),
  kind: storeKindSchema,
  neighborhood: z
    .string({ required_error: "El barrio es obligatorio" })
    .min(1, "El barrio no puede estar vacío")
    .max(100, "El barrio no puede superar los 100 caracteres"),
  coverageNotes: z.string().max(300, "Las notas no pueden superar los 300 caracteres").optional(),
  days: z.array(z.enum(PROFILE_DAYS)).min(1, "Seleccioná al menos un día de operación"),
  openTime: z
    .string({ required_error: "El horario de apertura es obligatorio" })
    .regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  closeTime: z
    .string({ required_error: "El horario de cierre es obligatorio" })
    .regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
});

export const storeProfileSchema = profileBaseSchema.refine(
  (data) => data.closeTime > data.openTime,
  { message: CLOSE_AFTER_OPEN_MESSAGE, path: CLOSE_AFTER_OPEN_PATH },
);

export const updateStoreProfileSchema = profileBaseSchema
  .omit({ storeId: true })
  .partial()
  .refine(
    (data) =>
      data.openTime === undefined || data.closeTime === undefined || data.closeTime > data.openTime,
    { message: CLOSE_AFTER_OPEN_MESSAGE, path: CLOSE_AFTER_OPEN_PATH },
  );

export type StoreProfile = z.infer<typeof storeProfileSchema>;
export type UpdateStoreProfileInput = z.infer<typeof updateStoreProfileSchema>;
