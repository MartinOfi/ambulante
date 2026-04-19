import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartSummaryBar } from "./CartSummaryBar";

describe("CartSummaryBar", () => {
  const defaultProps = {
    itemCount: 2,
    total: 1000,
    onCheckout: vi.fn(),
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
    expect(screen.getByText(/1\.500/)).toBeInTheDocument();
  });

  it("calls onCheckout when button is clicked", async () => {
    const onCheckout = vi.fn();
    render(<CartSummaryBar {...defaultProps} onCheckout={onCheckout} />);
    await userEvent.click(screen.getByRole("button", { name: /enviar pedido/i }));
    expect(onCheckout).toHaveBeenCalledOnce();
  });

  it("has the correct accessible region label", () => {
    render(<CartSummaryBar {...defaultProps} />);
    expect(screen.getByRole("region", { name: /resumen del carrito/i })).toBeInTheDocument();
  });
});
