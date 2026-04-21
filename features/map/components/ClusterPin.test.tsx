import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/shared/test-utils";
import { ClusterPin } from "./ClusterPin";

describe("ClusterPin", () => {
  it("renders the cluster count", () => {
    renderWithProviders(<ClusterPin count={5} onClick={vi.fn()} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    renderWithProviders(<ClusterPin count={3} onClick={handleClick} />);
    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("aria-label includes the count", () => {
    renderWithProviders(<ClusterPin count={12} onClick={vi.fn()} />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", expect.stringContaining("12"));
  });
});
