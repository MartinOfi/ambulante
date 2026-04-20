import { screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ModerationQueueContainer } from "./ModerationQueue.container";
import { renderWithProviders } from "@/shared/test-utils/render";
import { REPORT_STATUS, REPORT_REASON } from "@/features/content-moderation/constants";
import type { Report } from "@/features/content-moderation/schemas/content-moderation.schemas";

vi.mock("@/features/content-moderation/services/content-moderation.mock", () => ({
  contentModerationService: {
    listReports: vi.fn(),
    removeContent: vi.fn(),
    dismissReport: vi.fn(),
  },
}));

import { contentModerationService } from "@/features/content-moderation/services/content-moderation.mock";

const mockService = vi.mocked(contentModerationService);

const MOCK_REPORT: Report = {
  id: "report-1",
  productId: "product-1",
  productName: "Empanada de carne",
  storeId: "store-1",
  storeName: "El Rincón",
  reason: REPORT_REASON.INAPPROPRIATE,
  status: REPORT_STATUS.PENDING,
  reportedAt: "2026-04-20T10:00:00.000Z",
  reportedById: "user-reporter-1",
};

describe("ModerationQueueContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state while fetching", () => {
    mockService.listReports.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<ModerationQueueContainer />);
    expect(screen.getByText(/cargando reportes/i)).toBeInTheDocument();
  });

  it("renders reports when data loads", async () => {
    mockService.listReports.mockResolvedValue([MOCK_REPORT]);
    renderWithProviders(<ModerationQueueContainer />);
    await waitFor(() => {
      expect(screen.getByText("Empanada de carne")).toBeInTheDocument();
    });
  });

  it("calls removeContent when remove button is clicked", async () => {
    mockService.listReports.mockResolvedValue([MOCK_REPORT]);
    mockService.removeContent.mockResolvedValue({ ...MOCK_REPORT, status: REPORT_STATUS.RESOLVED });
    renderWithProviders(<ModerationQueueContainer />);
    await waitFor(() => screen.getByRole("button", { name: /eliminar contenido/i }));
    fireEvent.click(screen.getByRole("button", { name: /eliminar contenido/i }));
    await waitFor(() => {
      expect(mockService.removeContent).toHaveBeenCalledWith("report-1");
    });
  });

  it("calls dismissReport when dismiss button is clicked", async () => {
    mockService.listReports.mockResolvedValue([MOCK_REPORT]);
    mockService.dismissReport.mockResolvedValue({
      ...MOCK_REPORT,
      status: REPORT_STATUS.DISMISSED,
    });
    renderWithProviders(<ModerationQueueContainer />);
    await waitFor(() => screen.getByRole("button", { name: /desestimar/i }));
    fireEvent.click(screen.getByRole("button", { name: /desestimar/i }));
    await waitFor(() => {
      expect(mockService.dismissReport).toHaveBeenCalledWith("report-1");
    });
  });
});
