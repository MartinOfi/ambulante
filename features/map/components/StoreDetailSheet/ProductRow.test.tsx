import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Product } from "@/shared/schemas/product";
import { ProductRow } from "./ProductRow";

const PRODUCT: Product = {
  id: "prod-1",
  storeId: "store-1",
  name: "Empanada de carne",
  description: "Jugosa, cortada a cuchillo",
  priceArs: 600,
  isAvailable: true,
};

function renderRow(overrides: Partial<React.ComponentProps<typeof ProductRow>> = {}) {
  const props = {
    product: PRODUCT,
    quantity: 0,
    onAdd: vi.fn(),
    onIncrement: vi.fn(),
    onDecrement: vi.fn(),
    ...overrides,
  };
  render(
    <ul>
      <ProductRow {...props} />
    </ul>,
  );
  return props;
}

describe("ProductRow", () => {
  it("shows the 'Agregar' button when quantity is 0", () => {
    renderRow({ quantity: 0 });
    expect(screen.getByRole("button", { name: /agregar empanada de carne/i })).toBeInTheDocument();
  });

  it("calls onAdd with the product when 'Agregar' is clicked", async () => {
    const props = renderRow({ quantity: 0 });
    await userEvent.click(screen.getByRole("button", { name: /agregar empanada de carne/i }));
    expect(props.onAdd).toHaveBeenCalledWith(PRODUCT);
  });

  it("shows the stepper instead of 'Agregar' when quantity > 0", () => {
    renderRow({ quantity: 2 });
    expect(
      screen.queryByRole("button", { name: /agregar empanada de carne/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: /cantidad de empanada de carne/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("calls onIncrement when the '+' button is clicked", async () => {
    const props = renderRow({ quantity: 1 });
    await userEvent.click(
      screen.getByRole("button", { name: /aumentar cantidad de empanada de carne/i }),
    );
    expect(props.onIncrement).toHaveBeenCalledWith("prod-1");
  });

  it("calls onDecrement when the '−' button is clicked", async () => {
    const props = renderRow({ quantity: 2 });
    await userEvent.click(
      screen.getByRole("button", { name: /disminuir cantidad de empanada de carne/i }),
    );
    expect(props.onDecrement).toHaveBeenCalledWith("prod-1");
  });

  it("shows 'Sin stock' and no buttons when product is unavailable", () => {
    renderRow({ product: { ...PRODUCT, isAvailable: false } });
    expect(screen.getByText(/sin stock/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /agregar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /cantidad/i })).not.toBeInTheDocument();
  });

  it("announces quantity changes via aria-live", () => {
    renderRow({ quantity: 3 });
    const quantitySpan = screen.getByText("3");
    expect(quantitySpan).toHaveAttribute("aria-live", "polite");
  });

  it("displays the formatted price", () => {
    renderRow({ quantity: 0 });
    expect(screen.getByText(/\$\s?600/)).toBeInTheDocument();
  });
});
