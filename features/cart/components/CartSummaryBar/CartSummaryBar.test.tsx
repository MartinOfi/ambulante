import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartSummaryBar } from "./CartSummaryBar";

describe("CartSummaryBar", () => {
  const defaultProps = {
    itemCount: 2,
    total: 1000,
    onOpen: vi.fn(),
  };

  it("renders nothing when itemCount is 0", () => {
    const { container } = render(<CartSummaryBar {...defaultProps} itemCount={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows item count as '1 producto' (singular)", () => {
    render(<CartSummaryBar {...defaultProps} itemCount={1} />);
    expect(screen.getByText("1 producto")).toBeInTheDocument();
  });

  it("shows item count as '3 productos' (plural)", () => {
    render(<CartSummaryBar {...defaultProps} itemCount={3} />);
    expect(screen.getByText("3 productos")).toBeInTheDocument();
  });

  it("displays formatted price in ARS", () => {
    render(<CartSummaryBar {...defaultProps} total={1500} />);
    expect(screen.getByTestId("cart-summary-total")).toHaveTextContent(/1\.500/);
  });

  it("calls onOpen when the bar is tapped", async () => {
    const onOpen = vi.fn();
    render(<CartSummaryBar {...defaultProps} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole("button", { name: /ver pedido/i }));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("has the correct accessible region label", () => {
    render(<CartSummaryBar {...defaultProps} />);
    expect(screen.getByRole("region", { name: /resumen del carrito/i })).toBeInTheDocument();
  });

  it("announces item count changes via aria-live", () => {
    render(<CartSummaryBar {...defaultProps} itemCount={5} />);
    const liveRegion = screen.getByText("5 productos");
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
  });

  it("exposes count and total in the accessible button label", () => {
    render(<CartSummaryBar {...defaultProps} itemCount={3} total={2500} />);
    expect(screen.getByRole("button", { name: /ver pedido — 3 productos/i })).toBeInTheDocument();
  });
});
