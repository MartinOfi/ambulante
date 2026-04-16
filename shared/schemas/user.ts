import { z } from "zod";

export const userRoleSchema = z.enum(["client", "store", "admin"], {
  errorMap: () => ({ message: "Rol de usuario no válido" }),
});

export const userSchema = z
  .object({
    id: z
      .string({ required_error: "El ID es obligatorio" })
      .min(1, "El ID no puede estar vacío"),
    email: z
      .string({ required_error: "El email es obligatorio" })
      .email("El email no tiene un formato válido"),
    role: userRoleSchema,
    displayName: z.string().optional(),
  })
  .strict();

export type UserRole = z.infer<typeof userRoleSchema>;
export type User = z.infer<typeof userSchema>;
