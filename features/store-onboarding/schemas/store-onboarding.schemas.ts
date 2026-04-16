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

export const stepFiscalSchema = z.object({
  businessName: z
    .string({ required_error: "El nombre del negocio es obligatorio" })
    .min(1, "El nombre del negocio no puede estar vacío"),
  kind: storeKindSchema,
  cuit: z
    .string({ required_error: "El CUIT es obligatorio" })
    .regex(/^\d{11}$/, "El CUIT debe tener exactamente 11 dígitos"),
});

export const stepZoneSchema = z.object({
  neighborhood: z
    .string({ required_error: "El barrio es obligatorio" })
    .min(1, "El barrio no puede estar vacío"),
  coverageNotes: z.string().optional(),
});

export const stepHoursSchema = z.object({
  days: z.array(z.enum(STORE_ONBOARDING_DAYS)).min(1, "Seleccioná al menos un día de operación"),
  openTime: z
    .string({ required_error: "El horario de apertura es obligatorio" })
    .regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  closeTime: z
    .string({ required_error: "El horario de cierre es obligatorio" })
    .regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
});

export const storeOnboardingSchema = stepFiscalSchema
  .merge(stepZoneSchema)
  .merge(stepHoursSchema)
  .refine(({ openTime, closeTime }) => closeTime > openTime, {
    message: "El horario de cierre debe ser posterior al de apertura",
    path: ["closeTime"],
  });

export type StepFiscalValues = z.infer<typeof stepFiscalSchema>;
export type StepZoneValues = z.infer<typeof stepZoneSchema>;
export type StepHoursValues = z.infer<typeof stepHoursSchema>;
export type StoreOnboardingData = z.infer<typeof storeOnboardingSchema>;
