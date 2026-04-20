import type { Report } from "@/features/content-moderation/schemas/content-moderation.schemas";
import type { ReportStatus } from "@/features/content-moderation/constants";

export interface ListReportsInput {
  readonly status?: ReportStatus;
}

export interface ContentModerationService {
  readonly listReports: (input?: ListReportsInput) => Promise<readonly Report[]>;
  readonly removeContent: (reportId: string) => Promise<Report>;
  readonly dismissReport: (reportId: string) => Promise<Report>;
}
