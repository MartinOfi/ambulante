import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/shared/test-utils";
import { StoreShell } from "./StoreShell";

const makeProps = () => ({
  currentPath: "/store/dashboard",
  isAvailable: false,
  locationStatus: "idle" as const,
  onToggleAvailability: vi.fn(),
});

describe("StoreShell", () => {
  it("renders children", () => {
    renderWithProviders(
      <StoreShell {...makeProps()}>
        <div data-testid="child-content">contenido</div>
      </StoreShell>,
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("renders navigation", () => {
    renderWithProviders(
      <StoreShell {...makeProps()}>
        <span />
      </StoreShell>,
    );
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("renders availability toggle", () => {
    renderWithProviders(
      <StoreShell {...makeProps()}>
        <span />
      </StoreShell>,
    );
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("passes isAvailable=true to toggle", () => {
    renderWithProviders(
      <StoreShell {...makeProps()} isAvailable={true}>
        <span />
      </StoreShell>,
    );
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("passes isAvailable=false to toggle", () => {
    renderWithProviders(
      <StoreShell {...makeProps()} isAvailable={false}>
        <span />
      </StoreShell>,
    );
    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("calls onToggleAvailability when switch is clicked", async () => {
    const props = makeProps();
    const user = userEvent.setup();
    renderWithProviders(
      <StoreShell {...props}>
        <span />
      </StoreShell>,
    );
    await user.click(screen.getByRole("switch"));
    expect(props.onToggleAvailability).toHaveBeenCalledOnce();
  });
});
