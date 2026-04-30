import { z } from "zod";
import { storeKindSchema } from "@/shared/schemas/store";

export const STORE_ONBOARDING_DAYS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
] as const;

export type OnboardingDay = (typeof STORE_ONBOARDING_DAYS)[number];

const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

function isValidCuitCheckDigit(cuit: string): boolean {
  const digits = cuit.split("").map(Number);
  const sum = CUIT_WEIGHTS.reduce((acc, w, i) => acc + w * digits[i], 0);
  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : 11 - remainder;
  return checkDigit !== 10 && checkDigit === digits[10];
}

export const stepFiscalSchema = z.object({
  businessName: z
    .string({ required_error: "El nombre del negocio es obligatorio" })
    .min(1, "El nombre del negocio no puede estar vacío")
    .max(100, "El nombre no puede superar los 100 caracteres"),
  kind: storeKindSchema,
  cuit: z
    .string({ required_error: "El CUIT es obligatorio" })
    .regex(/^\d{11}$/, "El CUIT debe tener 11 dígitos")
    .refine(isValidCuitCheckDigit, "CUIT inválido"),
});

export const stepZoneSchema = z.object({
  neighborhood: z
    .string({ required_error: "El barrio es obligatorio" })
    .min(1, "El barrio no puede estar vacío")
    .max(100, "El barrio no puede superar los 100 caracteres"),
  coverageNotes: z.string().max(300, "Las notas no pueden superar los 300 caracteres").optional(),
});

const stepHoursBaseSchema = z.object({
  days: z.array(z.enum(STORE_ONBOARDING_DAYS)).min(1, "Seleccioná al menos un día de operación"),
  openTime: z
    .string({ required_error: "El horario de apertura es obligatorio" })
    .regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  closeTime: z
    .string({ required_error: "El horario de cierre es obligatorio" })
    .regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
});

const CLOSE_AFTER_OPEN_MESSAGE = "El horario de cierre debe ser posterior al de apertura";
const CLOSE_AFTER_OPEN_PATH = ["closeTime"];

// MVP: string comparison (HH:MM) rejects midnight-crossing shifts (e.g. 22:00–02:00).
// Acceptable for v1 — ambulante stores are assumed to operate within a single calendar day.
export const stepHoursSchema = stepHoursBaseSchema.refine(
  (data) => data.closeTime > data.openTime,
  { message: CLOSE_AFTER_OPEN_MESSAGE, path: CLOSE_AFTER_OPEN_PATH },
);

// Same midnight-crossing caveat as stepHoursSchema above.
export const storeOnboardingSchema = stepFiscalSchema
  .merge(stepZoneSchema)
  .merge(stepHoursBaseSchema)
  .refine((data) => data.closeTime > data.openTime, {
    message: CLOSE_AFTER_OPEN_MESSAGE,
    path: CLOSE_AFTER_OPEN_PATH,
  });

export type StepFiscalValues = z.infer<typeof stepFiscalSchema>;
export type StepZoneValues = z.infer<typeof stepZoneSchema>;
export type StepHoursValues = z.infer<typeof stepHoursSchema>;
export type StoreOnboardingData = z.infer<typeof storeOnboardingSchema>;
