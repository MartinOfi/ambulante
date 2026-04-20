import { z } from "zod";

export const suspendUserSchema = z.object({
  userId: z
    .string({ required_error: "El ID de usuario es obligatorio" })
    .min(1, "El ID de usuario no puede estar vacío"),
});

export const reinstateUserSchema = z.object({
  userId: z
    .string({ required_error: "El ID de usuario es obligatorio" })
    .min(1, "El ID de usuario no puede estar vacío"),
});

export type SuspendUserInput = z.infer<typeof suspendUserSchema>;
export type ReinstateUserInput = z.infer<typeof reinstateUserSchema>;
