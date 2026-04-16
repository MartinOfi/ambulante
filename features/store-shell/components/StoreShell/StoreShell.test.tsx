import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StoreShell } from "./StoreShell";

const defaultProps = {
  isSidebarOpen: true,
  onToggleSidebar: vi.fn(),
  isAvailable: false,
  onToggleAvailability: vi.fn(),
};

describe("StoreShell", () => {
  it("renders children", () => {
    render(
      <StoreShell {...defaultProps}>
        <div data-testid="child-content">contenido</div>
      </StoreShell>,
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("renders navigation", () => {
    render(
      <StoreShell {...defaultProps}>
        <span />
      </StoreShell>,
    );
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("renders availability toggle", () => {
    render(
      <StoreShell {...defaultProps}>
        <span />
      </StoreShell>,
    );
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("passes isAvailable=true to toggle", () => {
    render(
      <StoreShell {...defaultProps} isAvailable={true}>
        <span />
      </StoreShell>,
    );
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("passes isAvailable=false to toggle", () => {
    render(
      <StoreShell {...defaultProps} isAvailable={false}>
        <span />
      </StoreShell>,
    );
    expect(screen.getByRole("switch")).not.toBeChecked();
  });
});
