import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReportCard } from "./ReportCard";
import { REPORT_STATUS, REPORT_REASON } from "@/features/content-moderation/constants";
import type { Report } from "@/features/content-moderation/schemas/content-moderation.schemas";

const PENDING_REPORT: Report = {
  id: "report-1",
  productId: "product-1",
  productName: "Empanada de carne",
  storeId: "store-1",
  storeName: "El Rincón",
  reason: REPORT_REASON.INAPPROPRIATE,
  status: REPORT_STATUS.PENDING,
  reportedAt: "2026-04-20T10:00:00.000Z",
  reportedById: "user-1",
};

const RESOLVED_REPORT: Report = {
  ...PENDING_REPORT,
  id: "report-2",
  status: REPORT_STATUS.RESOLVED,
};

describe("ReportCard", () => {
  const onRemove = vi.fn();
  const onDismiss = vi.fn();

  const defaultProps = {
    report: PENDING_REPORT,
    isRemoving: false,
    isDismissing: false,
    onRemove,
    onDismiss,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders product name and store name", () => {
    render(<ReportCard {...defaultProps} />);
    expect(screen.getByText("Empanada de carne")).toBeInTheDocument();
    expect(screen.getByText(/El Rincón/)).toBeInTheDocument();
  });

  it("shows action buttons for pending reports", () => {
    render(<ReportCard {...defaultProps} />);
    expect(screen.getByRole("button", { name: /eliminar contenido/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /desestimar/i })).toBeInTheDocument();
  });

  it("hides action buttons for resolved reports", () => {
    render(<ReportCard {...defaultProps} report={RESOLVED_REPORT} />);
    expect(screen.queryByRole("button", { name: /eliminar contenido/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /desestimar/i })).not.toBeInTheDocument();
  });

  it("calls onRemove with report id when remove button is clicked", () => {
    render(<ReportCard {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /eliminar contenido/i }));
    expect(onRemove).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledWith("report-1");
  });

  it("calls onDismiss with report id when dismiss button is clicked", () => {
    render(<ReportCard {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /desestimar/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledWith("report-1");
  });

  it("disables buttons while removing", () => {
    render(<ReportCard {...defaultProps} isRemoving={true} />);
    expect(screen.getByRole("button", { name: /eliminando/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /desestimar/i })).toBeDisabled();
  });

  it("disables buttons while dismissing", () => {
    render(<ReportCard {...defaultProps} isDismissing={true} />);
    expect(screen.getByRole("button", { name: /desestimando/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /eliminar contenido/i })).toBeDisabled();
  });
});
