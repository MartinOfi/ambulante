export const STORE_VALIDATION_STATUS = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
} as const;

export const REJECTION_REASON_MIN_LENGTH = 10;
export const REJECTION_REASON_MAX_LENGTH = 500;

export const VALIDATION_DOC_TYPES = {
  ID_FRONT: "id_front",
  ID_BACK: "id_back",
  BUSINESS_PROOF: "business_proof",
} as const;

export const VALIDATION_DOC_TYPE_LABELS = {
  [VALIDATION_DOC_TYPES.ID_FRONT]: "DNI / Cédula (frente)",
  [VALIDATION_DOC_TYPES.ID_BACK]: "DNI / Cédula (dorso)",
  [VALIDATION_DOC_TYPES.BUSINESS_PROOF]: "Habilitación comercial",
} as const;

// Signed URL TTL: 1h. We refresh just before expiration to avoid handing the
// admin a URL that 403s mid-review (5 min margin).
export const VALIDATION_DOC_SIGNED_URL_EXPIRES_IN_S = 60 * 60;
export const VALIDATION_DOC_STALE_TIME_MS = (60 - 5) * 60 * 1_000;

export const VALIDATION_DOC_MIME_TYPE_PDF = "application/pdf";
