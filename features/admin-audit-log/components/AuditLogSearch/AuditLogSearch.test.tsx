import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuditLogSearch } from "./AuditLogSearch";

describe("AuditLogSearch", () => {
  it("renders a search input and submit button", () => {
    render(<AuditLogSearch onSearch={vi.fn()} isSearching={false} />);

    expect(screen.getByRole("textbox", { name: /id del pedido/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /buscar/i })).toBeInTheDocument();
  });

  it("shows validation error when submitting empty input", async () => {
    render(<AuditLogSearch onSearch={vi.fn()} isSearching={false} />);

    fireEvent.click(screen.getByRole("button", { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/ingresá el id del pedido/i)).toBeInTheDocument();
    });
  });

  it("calls onSearch with trimmed ID when form is valid", async () => {
    const onSearch = vi.fn();
    render(<AuditLogSearch onSearch={onSearch} isSearching={false} />);

    fireEvent.change(screen.getByRole("textbox", { name: /id del pedido/i }), {
      target: { value: "  order-abc-123  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /buscar/i }));

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith("order-abc-123");
    });
  });

  it("disables button while searching", () => {
    render(<AuditLogSearch onSearch={vi.fn()} isSearching={true} />);

    expect(screen.getByRole("button", { name: /buscando/i })).toBeDisabled();
  });

  it("shows error when ID exceeds max length", async () => {
    const onSearch = vi.fn();
    render(<AuditLogSearch onSearch={onSearch} isSearching={false} />);

    const longId = "a".repeat(200);
    fireEvent.change(screen.getByRole("textbox", { name: /id del pedido/i }), {
      target: { value: longId },
    });
    fireEvent.click(screen.getByRole("button", { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/demasiado largo/i)).toBeInTheDocument();
    });
    expect(onSearch).not.toHaveBeenCalled();
  });
});
