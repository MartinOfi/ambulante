import { z } from "zod";

export const coordinatesSchema = z
  .object({
    lat: z
      .number({ required_error: "La latitud es obligatoria" })
      .min(-90, "La latitud debe ser mayor o igual a -90")
      .max(90, "La latitud debe ser menor o igual a 90"),
    lng: z
      .number({ required_error: "La longitud es obligatoria" })
      .min(-180, "La longitud debe ser mayor o igual a -180")
      .max(180, "La longitud debe ser menor o igual a 180"),
  })
  .strict();

export type Coordinates = z.infer<typeof coordinatesSchema>;
