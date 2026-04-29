import { z } from "zod";

const REASON_MIN_LENGTH = 3;
const REASON_MAX_LENGTH = 500;

export const suspendUserSchema = z.object({
  userId: z
    .string({ required_error: "El ID de usuario es obligatorio" })
    .min(1, "El ID de usuario no puede estar vacío"),
  reason: z
    .string({ required_error: "El motivo de suspensión es obligatorio" })
    .trim()
    .min(REASON_MIN_LENGTH, `El motivo debe tener al menos ${REASON_MIN_LENGTH} caracteres`)
    .max(REASON_MAX_LENGTH, `El motivo no puede superar los ${REASON_MAX_LENGTH} caracteres`),
});

export const reactivateUserSchema = z.object({
  userId: z
    .string({ required_error: "El ID de usuario es obligatorio" })
    .min(1, "El ID de usuario no puede estar vacío"),
});

export const userDetailQuerySchema = z.object({
  userId: z
    .string({ required_error: "El ID de usuario es obligatorio" })
    .min(1, "El ID de usuario no puede estar vacío"),
});

export type SuspendUserInput = z.infer<typeof suspendUserSchema>;
export type ReactivateUserInput = z.infer<typeof reactivateUserSchema>;
export type UserDetailQueryInput = z.infer<typeof userDetailQuerySchema>;
