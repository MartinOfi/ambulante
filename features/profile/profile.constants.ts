import { STORAGE_SIZE_LIMITS } from "@/shared/constants/storage";

export const MAX_DISPLAY_NAME_LENGTH = 50;
export const MAX_AVATAR_BYTES = STORAGE_SIZE_LIMITS.AVATARS;
export const ALLOWED_AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const UPDATE_PROFILE_ERROR_CODE = Object.freeze({
  UNAUTHENTICATED: "UNAUTHENTICATED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const);

export type UpdateProfileErrorCode =
  (typeof UPDATE_PROFILE_ERROR_CODE)[keyof typeof UPDATE_PROFILE_ERROR_CODE];

export const UPDATE_PROFILE_ERROR_MESSAGE: Readonly<Record<UpdateProfileErrorCode, string>> =
  Object.freeze({
    UNAUTHENTICATED: "Sesión no válida. Iniciá sesión nuevamente.",
    VALIDATION_ERROR: "Datos inválidos.",
    INTERNAL_ERROR: "No se pudo guardar el perfil. Reintentá en unos segundos.",
  });

export const AVATAR_FILE_ERROR_MESSAGE = Object.freeze({
  TOO_LARGE: "La imagen es muy grande (máx 5 MB).",
  INVALID_TYPE: "Formato no soportado (jpg, png o webp).",
});
