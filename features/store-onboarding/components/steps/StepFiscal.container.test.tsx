import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StepFiscal } from "./StepFiscal.container";

describe("StepFiscal", () => {
  it("renders all fields", () => {
    render(<StepFiscal onNext={vi.fn()} />);
    expect(screen.getByLabelText(/nombre del negocio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de tienda/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cuit/i)).toBeInTheDocument();
  });

  it("calls onNext with valid values on submit", async () => {
    const onNext = vi.fn();
    render(<StepFiscal onNext={onNext} />);

    fireEvent.change(screen.getByLabelText(/nombre del negocio/i), {
      target: { value: "El Rincón" },
    });
    fireEvent.change(screen.getByLabelText(/cuit/i), {
      target: { value: "20304050607" },
    });
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));

    await waitFor(() => {
      expect(onNext).toHaveBeenCalledWith({
        businessName: "El Rincón",
        kind: "food-truck",
        cuit: "20304050607",
      });
    });
  });

  it("shows validation error for empty businessName", async () => {
    render(<StepFiscal onNext={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/nombre del negocio no puede estar vacío/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for invalid CUIT", async () => {
    render(<StepFiscal onNext={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/nombre del negocio/i), {
      target: { value: "Tienda" },
    });
    fireEvent.change(screen.getByLabelText(/cuit/i), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/11 dígitos/i)).toBeInTheDocument();
    });
  });

  it("pre-fills fields from defaultValues", () => {
    render(
      <StepFiscal
        defaultValues={{ businessName: "Prefilled", cuit: "20111222334", kind: "street-cart" }}
        onNext={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue("Prefilled")).toBeInTheDocument();
    expect(screen.getByDisplayValue("20111222334")).toBeInTheDocument();
  });
});
