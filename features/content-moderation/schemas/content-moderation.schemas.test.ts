import { describe, it, expect } from "vitest";
import { reportSchema } from "@/features/content-moderation/schemas/content-moderation.schemas";
import { REPORT_STATUS, REPORT_REASON } from "@/features/content-moderation/constants";

const VALID_REPORT = {
  id: "report-1",
  productId: "product-1",
  productName: "Empanada de carne",
  storeId: "store-1",
  storeName: "El Rincón",
  reason: REPORT_REASON.INAPPROPRIATE,
  status: REPORT_STATUS.PENDING,
  reportedAt: "2026-04-20T10:00:00.000Z",
  reportedById: "user-reporter-1",
} as const;

describe("reportSchema", () => {
  it("parses a valid report", () => {
    const result = reportSchema.parse(VALID_REPORT);
    expect(result.id).toBe("report-1");
    expect(result.status).toBe(REPORT_STATUS.PENDING);
    expect(result.reason).toBe(REPORT_REASON.INAPPROPRIATE);
  });

  it("accepts an optional productPhotoUrl", () => {
    const withPhoto = { ...VALID_REPORT, productPhotoUrl: "https://example.com/img.jpg" };
    const result = reportSchema.parse(withPhoto);
    expect(result.productPhotoUrl).toBe("https://example.com/img.jpg");
  });

  it("rejects an invalid productPhotoUrl", () => {
    const withBadPhoto = { ...VALID_REPORT, productPhotoUrl: "not-a-url" };
    expect(() => reportSchema.parse(withBadPhoto)).toThrow();
  });

  it("rejects an unknown reason", () => {
    const withBadReason = { ...VALID_REPORT, reason: "UNKNOWN" };
    expect(() => reportSchema.parse(withBadReason)).toThrow();
  });

  it("rejects an unknown status", () => {
    const withBadStatus = { ...VALID_REPORT, status: "INVALID" };
    expect(() => reportSchema.parse(withBadStatus)).toThrow();
  });

  it("rejects a missing required field", () => {
    const { id: _id, ...withoutId } = VALID_REPORT;
    expect(() => reportSchema.parse(withoutId)).toThrow();
  });

  it("rejects extra fields (strict mode)", () => {
    const withExtra = { ...VALID_REPORT, unknownField: "oops" };
    expect(() => reportSchema.parse(withExtra)).toThrow();
  });

  it("rejects non-datetime reportedAt", () => {
    const withBadDate = { ...VALID_REPORT, reportedAt: "not-a-date" };
    expect(() => reportSchema.parse(withBadDate)).toThrow();
  });
});
