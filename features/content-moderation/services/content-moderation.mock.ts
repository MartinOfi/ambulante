import {
  REPORT_STATUS,
  REPORT_REASON,
  CONTENT_MODERATION_MOCK_DELAY_MS,
} from "@/features/content-moderation/constants";
import type { Report } from "@/features/content-moderation/schemas/content-moderation.schemas";
import type {
  ContentModerationService,
  ListReportsInput,
} from "@/features/content-moderation/services/content-moderation.service";

const SEED_REPORTS: Report[] = [
  {
    id: "report-seed-1",
    productId: "product-seed-1",
    productName: "Empanada de carne",
    storeId: "store-seed-1",
    storeName: "El Rincón",
    reason: REPORT_REASON.INAPPROPRIATE,
    status: REPORT_STATUS.PENDING,
    reportedAt: "2026-04-18T10:00:00.000Z",
    reportedById: "user-seed-1",
  },
  {
    id: "report-seed-2",
    productId: "product-seed-2",
    productName: "Choripán con chimichurri",
    storeId: "store-seed-2",
    storeName: "Pancho al Paso",
    reason: REPORT_REASON.SPAM,
    status: REPORT_STATUS.PENDING,
    reportedAt: "2026-04-19T14:30:00.000Z",
    reportedById: "user-seed-2",
  },
  {
    id: "report-seed-3",
    productId: "product-seed-3",
    productName: "Helado de dulce de leche",
    storeId: "store-seed-3",
    storeName: "Tino Helados",
    reason: REPORT_REASON.MISLEADING,
    status: REPORT_STATUS.RESOLVED,
    reportedAt: "2026-04-17T09:15:00.000Z",
    reportedById: "user-seed-3",
  },
];

let _reports: Report[] = [...SEED_REPORTS];

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, CONTENT_MODERATION_MOCK_DELAY_MS));
}

function findReport(reportId: string): Report {
  const report = _reports.find((r) => r.id === reportId);
  if (!report) throw new Error(`Reporte no encontrado: ${reportId}`);
  return report;
}

export const contentModerationService: ContentModerationService = {
  async listReports(input?: ListReportsInput): Promise<readonly Report[]> {
    await delay();
    if (!input?.status) return [..._reports];
    return _reports.filter((r) => r.status === input.status);
  },

  async removeContent(reportId: string): Promise<Report> {
    await delay();
    const report = findReport(reportId);
    const updated: Report = { ...report, status: REPORT_STATUS.RESOLVED };
    _reports = _reports.map((r) => (r.id === reportId ? updated : r));
    return updated;
  },

  async dismissReport(reportId: string): Promise<Report> {
    await delay();
    const report = findReport(reportId);
    const updated: Report = { ...report, status: REPORT_STATUS.DISMISSED };
    _reports = _reports.map((r) => (r.id === reportId ? updated : r));
    return updated;
  },
};
