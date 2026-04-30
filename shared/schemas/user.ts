import { z } from "zod";

export const userRoleSchema = z.enum(["client", "store", "admin"], {
  errorMap: () => ({ message: "Rol de usuario no válido" }),
});

export const userSchema = z
  .object({
    id: z.string({ required_error: "El ID es obligatorio" }).min(1, "El ID no puede estar vacío"),
    email: z
      .string({ required_error: "El email es obligatorio" })
      .email("El email no tiene un formato válido"),
    role: userRoleSchema,
    displayName: z.string().optional(),
    avatarUrl: z.string().url("La URL del avatar no es válida").optional(),
    suspended: z.boolean().optional(),
  })
  .strict();

export const sessionSchema = z
  .object({
    accessToken: z
      .string({ required_error: "El access token es obligatorio" })
      .min(1, "El access token no puede estar vacío"),
    refreshToken: z
      .string({ required_error: "El refresh token es obligatorio" })
      .min(1, "El refresh token no puede estar vacío"),
    expiresAt: z
      .number({ required_error: "La fecha de expiración es obligatoria" })
      .int("La fecha de expiración debe ser un número entero")
      .positive("La fecha de expiración debe ser un timestamp positivo"),
    user: userSchema,
  })
  .strict();

export type UserRole = z.infer<typeof userRoleSchema>;
export type User = z.infer<typeof userSchema>;
export type Session = z.infer<typeof sessionSchema>;
