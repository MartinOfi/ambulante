import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ModerationQueue } from "./ModerationQueue";
import { REPORT_STATUS, REPORT_REASON } from "@/features/content-moderation/constants";
import type { Report } from "@/features/content-moderation/schemas/content-moderation.schemas";

const makeReport = (id: string): Report => ({
  id,
  productId: `product-${id}`,
  productName: `Producto ${id}`,
  storeId: "store-1",
  storeName: "La Tienda",
  reason: REPORT_REASON.SPAM,
  status: REPORT_STATUS.PENDING,
  reportedAt: "2026-04-20T10:00:00.000Z",
  reportedById: "user-1",
});

describe("ModerationQueue", () => {
  const baseProps = {
    reports: [] as readonly Report[],
    isLoading: false,
    removingId: null as string | null,
    dismissingId: null as string | null,
    onRemove: vi.fn(),
    onDismiss: vi.fn(),
  };

  it("shows a loading state when isLoading is true", () => {
    render(<ModerationQueue {...baseProps} isLoading={true} />);
    expect(screen.getByText(/cargando reportes/i)).toBeInTheDocument();
  });

  it("shows empty state when there are no reports", () => {
    render(<ModerationQueue {...baseProps} />);
    expect(screen.getByText(/no hay reportes pendientes/i)).toBeInTheDocument();
  });

  it("renders a card per report", () => {
    const reports = [makeReport("r1"), makeReport("r2"), makeReport("r3")];
    render(<ModerationQueue {...baseProps} reports={reports} />);
    expect(screen.getByText("Producto r1")).toBeInTheDocument();
    expect(screen.getByText("Producto r2")).toBeInTheDocument();
    expect(screen.getByText("Producto r3")).toBeInTheDocument();
  });
});
