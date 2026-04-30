import { z } from "zod";
import {
  ALLOWED_AVATAR_MIME_TYPES,
  MAX_AVATAR_BYTES,
  MAX_DISPLAY_NAME_LENGTH,
} from "@/features/profile/profile.constants";

export const updateProfileInputSchema = z
  .object({
    displayName: z
      .string()
      .min(1, "El nombre no puede estar vacío")
      .max(MAX_DISPLAY_NAME_LENGTH, `El nombre puede tener hasta ${MAX_DISPLAY_NAME_LENGTH} caracteres`)
      .optional(),
    avatarUrl: z.string().url("La URL del avatar no es válida").nullable().optional(),
  })
  .strict()
  .refine((data) => data.displayName !== undefined || data.avatarUrl !== undefined, {
    message: "Ningún cambio para guardar",
  });

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

export const avatarFileSchema = z.object({
  size: z.number().max(MAX_AVATAR_BYTES, "La imagen es muy grande (máx 5 MB)."),
  type: z.enum(ALLOWED_AVATAR_MIME_TYPES, {
    errorMap: () => ({ message: "Formato no soportado (jpg, png o webp)." }),
  }),
});
